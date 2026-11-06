import { Timestamp } from '@react-native-firebase/firestore';
import type { Movimentacao } from '../../../types/movimentacao.types';
import { normalizarMovimentacao } from '../../../utils/movimentacoes';

export function converterMovimentacao(dados: unknown, id: string, estabelecimentoId: string, produtoId: string,
  setorId: string, pendente = false, estimativa = new Date()): Movimentacao {
  if (!dados || typeof dados !== 'object') throw new Error('Movimentação inválida.');
  const d = dados as Record<string, unknown>;
  const campos = ['id', 'estabelecimentoId', 'produtoId', 'setorId', 'tipo', 'quantidade', 'observacao', 'vendedorNome', 'criadoPor', 'criadoEm', 'atualizadoEm'];
  if (Object.keys(d).some(c => !campos.includes(c)) || (d.id !== undefined ? d.id !== id : id !== `inicial_${produtoId}`) ||
      d.estabelecimentoId !== estabelecimentoId || d.produtoId !== produtoId || d.setorId !== setorId ||
      (d.tipo !== 'entrada' && d.tipo !== 'saida') || typeof d.quantidade !== 'number' ||
      typeof d.criadoPor !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(d.criadoPor) ||
      (d.observacao !== undefined && typeof d.observacao !== 'string')) throw new Error('Movimentação inválida.');
  const dadosValidos = normalizarMovimentacao({ quantidade: d.quantidade, observacao: d.observacao as string | undefined,
    vendedorNome: d.vendedorNome as string | undefined }, d.tipo);
  const criadoEm = d.criadoEm instanceof Timestamp ? d.criadoEm.toDate() : pendente && d.criadoEm === null ? new Date(estimativa) : null;
  const atualizadoEm = d.atualizadoEm instanceof Timestamp ? d.atualizadoEm.toDate() : undefined;
  if (d.atualizadoEm !== undefined && !atualizadoEm && !(pendente && d.atualizadoEm === null)) throw new Error('Data de atualização inválida.');
  if (!criadoEm) throw new Error('Data da movimentação inválida.');
  return { id, estabelecimentoId, produtoId, setorId, tipo: d.tipo, ...dadosValidos, criadoPor: d.criadoPor, criadoEm, ...(atualizadoEm ? { atualizadoEm } : {}) };
}
