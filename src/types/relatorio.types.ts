import type { Produto } from './produto.types';
import type { Setor } from './setor.types';
import type { Movimentacao, TipoMovimentacao } from './movimentacao.types';

/** Dias locais, com limite final exclusivo para incluir todo o último dia. */
export type IntervaloRelatorio = { inicio: Date; fimExclusivo: Date };
export type FiltrosRelatorio = IntervaloRelatorio & {
  setorId?: string;
  produtoId?: string;
  tipo?: TipoMovimentacao;
};
export type DadosRelatorio = {
  produtos: Produto[];
  setores: Setor[];
  movimentos: Movimentacao[];
  emCache: boolean;
};
export type ResumoMovimentacoes = {
  totalEntradas: number;
  totalSaidas: number;
  saldoPeriodo: number;
  quantidadeMovimentacoes: number;
  produtosMovimentados: number;
};
export type ProdutoMovimentacaoTotal = { produto: Produto; setor: Setor | undefined; quantidade: number };
export type TotalSetor = { setorId: string; nome: string; entradas: number; saidas: number };
export type MovimentoRelatorio = { movimento: Movimentacao; produto?: Produto; setor?: Setor };
export type ResultadoRelatorio = {
  resumo: ResumoMovimentacoes;
  movimentos: MovimentoRelatorio[];
  porSetor: TotalSetor[];
  maioresEntradas: ProdutoMovimentacaoTotal[];
  maioresSaidas: ProdutoMovimentacaoTotal[];
  semMovimentacao: Produto[];
  reposicao: Produto[];
  zerados: Produto[];
  setorPorId: Map<string, Setor>;
};
