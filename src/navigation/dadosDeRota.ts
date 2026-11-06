import type { DadosRota } from './types';

/** Datas pertencem ao histórico; formulários e rotas usam apenas dados serializáveis. */
export function dadosDeRota<T extends { criadoEm: Date; atualizadoEm?: Date; inativadoEm?: Date | null }>(dados: T): DadosRota<T> {
  const { criadoEm, atualizadoEm, inativadoEm, ...campos } = dados;
  return campos;
}
