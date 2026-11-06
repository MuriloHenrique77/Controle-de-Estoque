import type { ContaAutenticada } from '../../../types/session.types';
import type { Usuario } from '../../../types/usuario.types';
import type { Estabelecimento } from '../../../types/estabelecimento.types';
import { Timestamp } from '@react-native-firebase/firestore';
import { timestampParaDate } from './datas';

export function converterPerfil(dados: unknown, conta: ContaAutenticada): Usuario {
  if (!dados || typeof dados !== 'object') throw new Error('Perfil inválido.');
  const p = dados as Record<string, unknown>;
  if (Object.keys(p).length !== 3 || p.id !== conta.uid || p.email !== conta.email || !conta.email ||
      typeof p.estabelecimentoId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(p.estabelecimentoId)) throw new Error('Perfil inválido.');
  return { id: conta.uid, email: conta.email, estabelecimentoId: p.estabelecimentoId };
}

export function converterEstabelecimento(dados: unknown, id: string, uid: string): Estabelecimento {
  if (!dados || typeof dados !== 'object') throw new Error('Estabelecimento inválido.');
  const e = dados as Record<string, unknown>;
  if (Object.keys(e).length !== 4 || e.id !== id || typeof e.nome !== 'string' || !e.nome.trim() ||
      e.nome !== e.nome.trim() || e.nome.length > 120 || e.criadoPor !== uid ||
      !(e.criadoEm instanceof Timestamp)) throw new Error('Estabelecimento inválido.');
  return { id, nome: e.nome, criadoPor: uid, criadoEm: timestampParaDate(e.criadoEm) };
}
