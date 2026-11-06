import type { Movimentacao, TipoMovimentacao } from '../types/movimentacao.types';
import { inteiroEstoque } from './produtos';

// Registro técnico compatível com as Rules existentes; não limita o histórico.
export const LIMITE_REGISTRO_MOVIMENTACOES = 6;
export type DadosMovimentacao = { quantidade: number; observacao?: string; vendedorNome?: string };
export type DadosEntrada = Omit<DadosMovimentacao, 'vendedorNome'> & { vendedorNome?: never };
export type RegistroMovimentacoes = { quantidadeMovimentacoes: number; movimentacaoIds: string[]; ultimaMovimentacaoId?: string };
const idValido = (valor: unknown): valor is string => typeof valor === 'string' &&
  (/^[a-zA-Z0-9_-]{1,128}$/.test(valor) || /^inicial_[a-zA-Z0-9_-]{1,128}$/.test(valor));

export function normalizarMovimentacao(dados: DadosMovimentacao, tipo?: TipoMovimentacao): DadosMovimentacao {
  if (!inteiroEstoque(dados.quantidade) || dados.quantidade === 0) throw new Error('A quantidade deve ser um inteiro maior que zero, até 9007199254740991.');
  const observacao = dados.observacao?.trim();
  if (observacao && observacao.length > 2000) throw new Error('A observação deve ter no máximo 2000 caracteres.');
  let vendedorNome: string | undefined;
  if (dados.vendedorNome !== undefined) {
    if (tipo !== 'saida') throw new Error('Vendedor só pode ser informado em saídas.');
    if (typeof dados.vendedorNome !== 'string' || !dados.vendedorNome.trim()) throw new Error('Informe o nome do vendedor.');
    vendedorNome = dados.vendedorNome.trim();
    if (vendedorNome.length > 80) throw new Error('O nome do vendedor deve ter no máximo 80 caracteres.');
  }
  return { quantidade: dados.quantidade, ...(observacao ? { observacao } : {}), ...(vendedorNome ? { vendedorNome } : {}) };
}

export function calcularNovoEstoque(estoque: number, tipo: TipoMovimentacao, quantidade: number): number {
  normalizarMovimentacao({ quantidade });
  if (!inteiroEstoque(estoque) || (tipo !== 'entrada' && tipo !== 'saida')) throw new Error('Dados de estoque inválidos.');
  if (tipo === 'saida' && quantidade > estoque) throw new Error('Estoque insuficiente.');
  const resultado = tipo === 'entrada' ? estoque + quantidade : estoque - quantidade;
  if (!inteiroEstoque(resultado)) throw new Error('O estoque resultante excede o limite de inteiros seguros.');
  return resultado;
}

export function lerRegistroMovimentacoes(d: Record<string, unknown>, id: string): RegistroMovimentacoes {
  const inicial = typeof d.quantidadeInicial === 'number' && d.quantidadeInicial > 0 ? [`inicial_${id}`] : [];
  const campos = ['quantidadeMovimentacoes', 'movimentacaoIds', 'ultimaMovimentacaoId'];
  if (campos.every(c => d[c] === undefined)) return { quantidadeMovimentacoes: inicial.length, movimentacaoIds: inicial,
    ...(inicial.length ? { ultimaMovimentacaoId: inicial[0] } : {}) };
  const count = d.quantidadeMovimentacoes, ids = d.movimentacaoIds, ultima = d.ultimaMovimentacaoId;
  if (!inteiroEstoque(count) || !Array.isArray(ids) || ids.length > Math.min(count, LIMITE_REGISTRO_MOVIMENTACOES) ||
      ids.some(v => !idValido(v)) || new Set(ids).size !== ids.length ||
      (ultima !== undefined ? !idValido(ultima) : count > 0)) {
    throw new Error('Registro de movimentações inválido.');
  }
  return { quantidadeMovimentacoes: count, movimentacaoIds: ids as string[], ...(typeof ultima === 'string' ? { ultimaMovimentacaoId: ultima } : {}) };
}

export function acrescentarMovimentacao(registro: RegistroMovimentacoes, id: string): RegistroMovimentacoes {
  if (!idValido(id) || registro.movimentacaoIds.includes(id) || !inteiroEstoque(registro.quantidadeMovimentacoes + 1)) throw new Error('Registro de movimentações inválido.');
  return { quantidadeMovimentacoes: registro.quantidadeMovimentacoes + 1,
    movimentacaoIds: registro.movimentacaoIds.length < LIMITE_REGISTRO_MOVIMENTACOES ? [...registro.movimentacaoIds, id] : registro.movimentacaoIds,
    ultimaMovimentacaoId: id };
}

export function ordenarMovimentacoes(movs: readonly Movimentacao[]): Movimentacao[] {
  return [...movs].sort((a,b) => b.criadoEm.getTime() - a.criadoEm.getTime() || b.id.localeCompare(a.id));
}

export function mensagemErroMovimentacao(erro: unknown, alteracao = false): string {
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro ? String(erro.code) : '';
  // Android pode encapsular UNAVAILABLE da leitura da transaction como unknown.
  const indisponivelEncapsulado = codigo === 'firestore/unknown' && erro instanceof Error && /\bUNAVAILABLE:/.test(erro.message);
  if (codigo.includes('unavailable') || codigo.includes('deadline-exceeded') || indisponivelEncapsulado) return alteracao ? 'É necessária conexão para alterar movimentações.' : 'É necessária conexão para registrar esta movimentação.';
  if (codigo.includes('permission-denied')) return 'Movimentação não autorizada. Confira sua sessão e tente novamente.';
  if (codigo.includes('aborted')) return 'O estoque mudou durante a operação. Tente novamente.';
  return erro instanceof Error && !codigo ? erro.message : (alteracao ? 'Não foi possível alterar a movimentação. Tente novamente.' : 'Não foi possível registrar a movimentação. Tente novamente.');
}

/** Substitui a contribuição antiga; nunca soma a antiga e a nova simultaneamente. */
export function calcularEstoqueEdicao(estoque: number, tipo: TipoMovimentacao, antiga: number, nova: number): number {
  normalizarMovimentacao({ quantidade: antiga }); normalizarMovimentacao({ quantidade: nova });
  if (!inteiroEstoque(estoque) || !['entrada', 'saida'].includes(tipo)) throw new Error('Dados de estoque inválidos.');
  const saldo = estoque + (tipo === 'entrada' ? nova - antiga : antiga - nova);
  if (saldo < 0) throw new Error('Não é possível editar esta movimentação porque o estoque ficaria negativo.');
  if (!inteiroEstoque(saldo)) throw new Error('O estoque resultante excede o limite de inteiros seguros.');
  return saldo;
}
export function calcularEstoqueExclusao(estoque: number, tipo: TipoMovimentacao, quantidade: number): number {
  normalizarMovimentacao({ quantidade });
  if (tipo === 'entrada' && estoque < quantidade) throw new Error('Não é possível excluir esta entrada porque o estoque ficaria negativo.');
  return calcularNovoEstoque(estoque, tipo === 'entrada' ? 'saida' : 'entrada', quantidade);
}
export function retirarMovimentacao(registro: RegistroMovimentacoes, id: string): RegistroMovimentacoes {
  if (!idValido(id) || registro.quantidadeMovimentacoes < 1) throw new Error('Registro de movimentações inválido.');
  return { quantidadeMovimentacoes: registro.quantidadeMovimentacoes - 1,
    movimentacaoIds: registro.movimentacaoIds.filter(v => v !== id), ultimaMovimentacaoId: id };
}
