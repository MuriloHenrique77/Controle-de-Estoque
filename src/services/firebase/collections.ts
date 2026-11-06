export const COLLECTIONS = {
  usuarios: 'usuarios',
  estabelecimentos: 'estabelecimentos',
  setores: 'setores',
  produtos: 'produtos',
  movimentacoes: 'movimentacoes',
} as const;

export type NomeColecao = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
