import type { Produto } from '../types/produto.types';
import type { DadosRelatorio, FiltrosRelatorio, ProdutoMovimentacaoTotal, ResultadoRelatorio, TotalSetor } from '../types/relatorio.types';
import { ordenarMovimentacoes } from './movimentacoes';
import { produtoAtivo } from './cicloProduto';
import { precisaReposicao } from './produtos';
import { validarIntervaloRelatorio } from './periodoRelatorio';

function somar(a: number, b: number): number {
  const resultado = a + b;
  if (!Number.isSafeInteger(resultado)) throw new Error('Os totais excedem o limite de inteiros seguros. Reduza o período.');
  return resultado;
}
const ordenarProduto = (a: Produto, b: Produto) => a.nome.localeCompare(b.nome, 'pt-BR') || a.id.localeCompare(b.id);

export function agregarRelatorio(estabelecimentoId: string, dados: DadosRelatorio, filtro: FiltrosRelatorio): ResultadoRelatorio {
  validarIntervaloRelatorio(filtro);
  // Defesa adicional; isolamento principal já ocorre nas três consultas ao servidor.
  if (!estabelecimentoId || [...dados.produtos, ...dados.setores, ...dados.movimentos]
    .some(d => d.estabelecimentoId !== estabelecimentoId)) throw new Error('Dados indisponíveis nesta sessão.');
  const produtoPorId = new Map(dados.produtos.map(p => [p.id, p]));
  const setorPorId = new Map(dados.setores.map(s => [s.id, s]));
  const elegiveis = dados.produtos.filter(p => (!filtro.setorId || p.setorId === filtro.setorId) &&
    (!filtro.produtoId || p.id === filtro.produtoId)).sort(ordenarProduto);
  const movimentosPeriodo = dados.movimentos.filter(m => m.criadoEm.getTime() >= filtro.inicio.getTime() &&
    m.criadoEm.getTime() < filtro.fimExclusivo.getTime() &&
    (!filtro.setorId || m.setorId === filtro.setorId) && (!filtro.produtoId || m.produtoId === filtro.produtoId));
  // RF-21: ausência de entrada E saída, independente do filtro de tipo.
  const movimentadosPeriodo = new Set(movimentosPeriodo.map(m => m.produtoId));
  const movimentos = ordenarMovimentacoes(movimentosPeriodo.filter(m => !filtro.tipo || m.tipo === filtro.tipo));
  const entradas = new Map<string, number>(), saidas = new Map<string, number>(), porSetor = new Map<string, TotalSetor>();
  let totalEntradas = 0, totalSaidas = 0;
  for (const m of movimentos) {
    if (!Number.isSafeInteger(m.quantidade) || m.quantidade <= 0 || !['entrada', 'saida'].includes(m.tipo)) {
      throw new Error('Há movimentações inválidas no relatório.');
    }
    const totais = m.tipo === 'entrada' ? entradas : saidas;
    totais.set(m.produtoId, somar(totais.get(m.produtoId) ?? 0, m.quantidade));
    const setor = porSetor.get(m.setorId) ?? { setorId: m.setorId, nome: setorPorId.get(m.setorId)?.nome ?? 'Setor indisponível', entradas: 0, saidas: 0 };
    if (m.tipo === 'entrada') { totalEntradas = somar(totalEntradas, m.quantidade); setor.entradas = somar(setor.entradas, m.quantidade); }
    else { totalSaidas = somar(totalSaidas, m.quantidade); setor.saidas = somar(setor.saidas, m.quantidade); }
    porSetor.set(m.setorId, setor);
  }
  function ranking(totais: Map<string, number>): ProdutoMovimentacaoTotal[] {
    return elegiveis.filter(p => totais.has(p.id)).map(produto => ({ produto, setor: setorPorId.get(produto.setorId), quantidade: totais.get(produto.id)! }))
      .sort((a,b) => b.quantidade - a.quantidade || ordenarProduto(a.produto, b.produto));
  }
  return {
    resumo: { totalEntradas, totalSaidas, saldoPeriodo: totalEntradas - totalSaidas,
      quantidadeMovimentacoes: movimentos.length, produtosMovimentados: new Set(movimentos.map(m => m.produtoId)).size },
    movimentos: movimentos.map(movimento => ({ movimento, produto: produtoPorId.get(movimento.produtoId), setor: setorPorId.get(movimento.setorId) })),
    porSetor: [...porSetor.values()].sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.setorId.localeCompare(b.setorId)),
    maioresEntradas: ranking(entradas), maioresSaidas: ranking(saidas),
    semMovimentacao: elegiveis.filter(p => produtoAtivo(p) && !movimentadosPeriodo.has(p.id)),
    reposicao: elegiveis.filter(p => produtoAtivo(p) && precisaReposicao(p)), zerados: elegiveis.filter(p => produtoAtivo(p) && p.estoqueAtual === 0), setorPorId,
  };
}

export function mensagemErroRelatorio(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro ? String(erro.code) : '';
  if (codigo.includes('permission-denied')) return 'Não foi possível acessar o relatório nesta sessão. Entre novamente.';
  if (codigo.includes('failed-precondition')) return 'O relatório ainda não está disponível no servidor. Tente novamente mais tarde.';
  if (codigo.includes('unavailable')) return 'Não foi possível carregar os dados. Confira sua conexão e tente novamente.';
  return erro instanceof Error && !codigo ? erro.message : 'Não foi possível carregar o relatório. Tente novamente.';
}
