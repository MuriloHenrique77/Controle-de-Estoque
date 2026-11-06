import type { Produto } from '../types/produto.types';

export type ContextoProdutos = { uid: string; estabelecimentoId: string };
export type DadosEdicaoProduto = { nome: string; descricao?: string; estoqueMinimo?: number };
export type DadosNovoProduto = DadosEdicaoProduto & { quantidadeInicial: number };

export function inteiroEstoque(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0;
}

export function normalizarEdicaoProduto(dados: DadosEdicaoProduto): DadosEdicaoProduto {
  const nome = dados.nome.trim();
  const descricao = dados.descricao?.trim();
  if (!nome) throw new Error('Informe o nome do produto.');
  if (nome.length > 120) throw new Error('O nome deve ter no máximo 120 caracteres.');
  if (descricao && descricao.length > 2000) throw new Error('A descrição deve ter no máximo 2000 caracteres.');
  if (dados.estoqueMinimo !== undefined && !inteiroEstoque(dados.estoqueMinimo)) {
    throw new Error('O estoque mínimo deve ser um inteiro não negativo, até 9007199254740991.');
  }
  return { nome, ...(descricao ? { descricao } : {}),
    ...(dados.estoqueMinimo !== undefined ? { estoqueMinimo: dados.estoqueMinimo } : {}) };
}

export function normalizarNovoProduto(dados: DadosNovoProduto): DadosNovoProduto {
  const edicao = normalizarEdicaoProduto(dados);
  if (!inteiroEstoque(dados.quantidadeInicial)) {
    throw new Error('A quantidade inicial deve ser um inteiro não negativo, até 9007199254740991.');
  }
  return { ...edicao, quantidadeInicial: dados.quantidadeInicial };
}

export function lerQuantidadeFormulario(texto: string, campo: string): number {
  if (!/^\d+$/.test(texto.trim()) || !inteiroEstoque(Number(texto.trim()))) {
    throw new Error(`${campo} deve ser um inteiro não negativo, até 9007199254740991.`);
  }
  return Number(texto.trim());
}

export function precisaReposicao(produto: Pick<Produto, 'estoqueAtual' | 'estoqueMinimo'>): boolean {
  return produto.estoqueMinimo !== undefined && produto.estoqueAtual <= produto.estoqueMinimo;
}

const comparador = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
export function ordenarProdutos(produtos: readonly Produto[]): Produto[] {
  return [...produtos].sort((a, b) => comparador.compare(a.nome, b.nome) || a.id.localeCompare(b.id));
}

export function mensagemErroProdutos(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro ? String(erro.code) : '';
  if (codigo === 'app/web-unavailable') return 'Produtos no Firestore estão disponíveis apenas no aplicativo Android.';
  if (codigo.includes('unavailable')) return 'Verifique sua conexão e tente novamente.';
  if (codigo.includes('permission-denied')) return 'Operação não autorizada. Confira sua sessão e tente novamente.';
  if (erro instanceof Error && !codigo) return erro.message;
  return 'Não foi possível concluir a operação de produtos. Tente novamente.';
}
