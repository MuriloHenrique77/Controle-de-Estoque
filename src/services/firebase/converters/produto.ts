import { Timestamp } from '@react-native-firebase/firestore';
import type { Produto } from '../../../types/produto.types';
import { inteiroEstoque, normalizarNovoProduto } from '../../../utils/produtos';
import { lerRegistroMovimentacoes } from '../../../utils/movimentacoes';

export function converterProduto(dados: unknown, id: string, estabelecimentoId: string, setorId: string,
  pendente = false, dataEstimada = new Date()): Produto {
  if (!dados || typeof dados !== 'object') throw new Error('Produto inválido.');
  const d = dados as Record<string, unknown>;
  const campos = ['id', 'estabelecimentoId', 'setorId', 'nome', 'descricao', 'quantidadeInicial',
    'estoqueMinimo', 'estoqueAtual', 'criadoEm', 'atualizadoEm', 'quantidadeMovimentacoes',
    'movimentacaoIds', 'ultimaMovimentacaoId', 'status', 'inativadoEm', 'inativadoPor', 'possuiHistorico'];
  if (Object.keys(d).some(c => !campos.includes(c)) || d.id !== id || d.estabelecimentoId !== estabelecimentoId ||
      d.setorId !== setorId || typeof d.nome !== 'string' ||
      (d.descricao !== undefined && typeof d.descricao !== 'string') ||
      !inteiroEstoque(d.quantidadeInicial) || !inteiroEstoque(d.estoqueAtual) ||
      (d.estoqueMinimo !== undefined && !inteiroEstoque(d.estoqueMinimo))) throw new Error('Produto inválido.');
  const normalizado = normalizarNovoProduto({ nome: d.nome, descricao: d.descricao as string | undefined,
    quantidadeInicial: d.quantidadeInicial, estoqueMinimo: d.estoqueMinimo as number | undefined });
  lerRegistroMovimentacoes(d, id);
  if ((d.status !== undefined && d.status !== 'ativo' && d.status !== 'inativo') ||
      (d.possuiHistorico !== undefined && typeof d.possuiHistorico !== 'boolean') ||
      (d.inativadoPor !== undefined && d.inativadoPor !== null &&
        (typeof d.inativadoPor !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(d.inativadoPor)))) throw new Error('Ciclo de vida do produto inválido.');
  function data(valor: unknown): Date {
    if (valor instanceof Timestamp) return valor.toDate();
    if (pendente && valor === null) return new Date(dataEstimada);
    throw new Error('Data do produto inválida.');
  }
  const status = d.status === 'inativo' ? 'inativo' : 'ativo';
  const inativadoEm = d.inativadoEm == null ? null : data(d.inativadoEm);
  const inativadoPor = typeof d.inativadoPor === 'string' ? d.inativadoPor : null;
  if (status === 'ativo' && (inativadoEm !== null || inativadoPor !== null)) throw new Error('Ciclo de vida do produto inválido.');
  if (status === 'inativo' && (!inativadoPor || (!inativadoEm && !pendente))) throw new Error('Ciclo de vida do produto inválido.');
  return { id, estabelecimentoId, setorId, ...normalizado, estoqueAtual: d.estoqueAtual, status, inativadoEm, inativadoPor,
    ...(typeof d.possuiHistorico === 'boolean' ? { possuiHistorico: d.possuiHistorico } : {}),
    criadoEm: data(d.criadoEm), ...(d.atualizadoEm !== undefined ? { atualizadoEm: data(d.atualizadoEm) } : {}) };
}
