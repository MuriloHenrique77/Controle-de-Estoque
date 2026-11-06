import { Timestamp } from '@react-native-firebase/firestore';
import type { Setor } from '../../../types/setor.types';
import { normalizarDadosSetor } from '../../../utils/setores';
import { timestampParaDate } from './datas';

export function converterSetor(dados: unknown, id: string, estabelecimentoId: string,
  pendente = false, dataEstimada = new Date()): Setor {
  if (!dados || typeof dados !== 'object') throw new Error('Setor inválido.');
  const d = dados as Record<string, unknown>;
  const permitidos = ['id', 'estabelecimentoId', 'nome', 'descricao', 'criadoEm', 'atualizadoEm',
    'quantidadeProdutos', 'ultimaOperacaoProdutoId'];
  if (Object.keys(d).some(chave => !permitidos.includes(chave)) || d.id !== id ||
      d.estabelecimentoId !== estabelecimentoId || typeof d.nome !== 'string' ||
      (d.descricao !== undefined && typeof d.descricao !== 'string')) throw new Error('Setor inválido.');
  if ((d.quantidadeProdutos !== undefined && (typeof d.quantidadeProdutos !== 'number' ||
      !Number.isSafeInteger(d.quantidadeProdutos) || d.quantidadeProdutos < 0)) ||
      (d.ultimaOperacaoProdutoId !== undefined && (typeof d.ultimaOperacaoProdutoId !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(d.ultimaOperacaoProdutoId) || d.quantidadeProdutos === undefined))) {
    throw new Error('Contagem de produtos do setor inválida.');
  }
  const normalizado = normalizarDadosSetor({ nome: d.nome, descricao: d.descricao as string | undefined });
  function data(valor: unknown): Date {
    if (valor instanceof Timestamp) return timestampParaDate(valor);
    // Só um timestamp explicitamente nulo em escrita pendente admite estimativa.
    if (pendente && valor === null) return new Date(dataEstimada);
    throw new Error('Data do setor inválida.');
  }
  return { id, estabelecimentoId, ...normalizado, criadoEm: data(d.criadoEm),
    ...(d.atualizadoEm !== undefined ? { atualizadoEm: data(d.atualizadoEm) } : {}) };
}
