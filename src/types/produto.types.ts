/** Estoque atual é derivado das movimentações, nunca um saldo editável. */
export type Produto = {
  id: string;
  estabelecimentoId: string;
  setorId: string;
  nome: string;
  descricao?: string;
  quantidadeInicial: number;
  estoqueMinimo?: number;
  status: 'ativo' | 'inativo';
  inativadoEm: Date | null;
  inativadoPor: string | null;
  /** Ausente somente no legado: nunca equivale a false para exclusão. */
  readonly possuiHistorico?: boolean;
  /** Projeção persistida, mantida atomicamente com as movimentações. */
  readonly estoqueAtual: number;
  criadoEm: Date;
  atualizadoEm?: Date;
};
