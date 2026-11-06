import type { DadosVisaoEstoque, MovimentoGlobal, ResumoHome } from '../types/visaoEstoque.types';
import { produtoAtivo } from './cicloProduto';
import { precisaReposicao } from './produtos';

export function validarVisaoEstoque(estabelecimentoId: string, dados: DadosVisaoEstoque): void {
  if (!estabelecimentoId || [...dados.produtos, ...dados.setores, ...dados.movimentos]
    .some(item => item.estabelecimentoId !== estabelecimentoId)) throw new Error('Dados fora do estabelecimento atual.');
}
export function resumirHome(estabelecimentoId: string, dados: DadosVisaoEstoque): ResumoHome {
  validarVisaoEstoque(estabelecimentoId, dados);
  const ativos = dados.produtos.filter(produtoAtivo);
  return { totalProdutos: ativos.length, totalSetores: dados.setores.length,
    totalReposicao: ativos.filter(precisaReposicao).length,
    totalZerados: ativos.filter(p => p.estoqueAtual === 0).length };
}
export function listarMovimentosGlobais(estabelecimentoId: string, dados: DadosVisaoEstoque): MovimentoGlobal[] {
  validarVisaoEstoque(estabelecimentoId, dados);
  const produtos = new Map(dados.produtos.map(p => [p.id, p]));
  const setores = new Map(dados.setores.map(s => [s.id, s]));
  return [...dados.movimentos].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime() || a.id.localeCompare(b.id))
    .map(movimento => ({ movimento, produto: produtos.get(movimento.produtoId), setor: setores.get(movimento.setorId) }));
}
export function mensagemErroVisaoEstoque(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro ? String(erro.code) : '';
  if (codigo === 'app/web-unavailable') return 'Os dados do estoque estão disponíveis no aplicativo Android.';
  if (codigo.includes('unavailable')) return 'Verifique sua conexão e tente novamente.';
  if (codigo.includes('permission-denied')) return 'Não foi possível acessar os dados deste estabelecimento. Confira sua sessão.';
  if (codigo.includes('failed-precondition')) return 'Os dados estão temporariamente indisponíveis. Tente novamente mais tarde.';
  return 'Não foi possível carregar o estoque. Tente novamente.';
}
