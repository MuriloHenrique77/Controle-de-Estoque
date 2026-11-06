export type TipoMovimentacao = 'entrada' | 'saida';

export type Movimentacao = {
  id: string;
  estabelecimentoId: string;
  produtoId: string;
  setorId: string;
  readonly tipo: TipoMovimentacao;
  quantidade: number;
  observacao?: string;
  vendedorNome?: string;
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm?: Date;
};

/** A edição não permite alterar tipo, produto ou estabelecimento. */
export type EdicaoMovimentacao = Pick<Movimentacao, 'quantidade' | 'observacao' | 'vendedorNome'>;
