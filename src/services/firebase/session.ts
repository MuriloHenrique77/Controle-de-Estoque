import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, validatePassword, sendPasswordResetEmail, setLanguageCode } from '@react-native-firebase/auth';
import { collection, doc, getDocFromServer, serverTimestamp, writeBatch } from '@react-native-firebase/firestore';
import { obterAuth } from './auth';
import { obterFirestore } from './firestore';
import { COLLECTIONS } from './collections';
import type { ContaAutenticada } from '../../types/session.types';
import { converterPerfil, converterEstabelecimento } from './converters/onboarding';
import { validarNomeEstabelecimento, validarEmailRecuperacao } from '../../utils/auth';

export const firebaseNativoDisponivel = true;

export function contaAtual(): ContaAutenticada | null {
  const user = obterAuth().currentUser;
  if (!user) return null;
  if (!user.email) throw new Error('Conta sem e-mail.');
  return { uid: user.uid, email: user.email };
}

export function observarAutenticacao(next: (conta: ContaAutenticada | null) => void): () => void {
  return onAuthStateChanged(obterAuth(), user => {
    next(user ? { uid: user.uid, email: user.email ?? '' } : null);
  });
}

export async function entrar(email: string, senha: string): Promise<void> {
  await signInWithEmailAndPassword(obterAuth(), email.trim(), senha);
}

export async function cadastrar(email: string, senha: string): Promise<void> {
  const auth = obterAuth();
  const validacao = await validatePassword(auth, senha);
  if (!validacao.isValid) throw { code: 'auth/password-does-not-meet-requirements' };
  await createUserWithEmailAndPassword(auth, email.trim(), senha);
}

export async function sair(): Promise<void> {
  await signOut(obterAuth());
}

let redefinicaoEmAndamento = false;
async function enviarRedefinicaoSenha(email: string, uidEsperado?: string): Promise<void> {
  const erro = validarEmailRecuperacao(email);
  if (erro) throw new Error(erro);
  if (redefinicaoEmAndamento) throw { code: 'auth/request-in-progress' };
  redefinicaoEmAndamento = true;
  try {
    const auth = obterAuth();
    await setLanguageCode(auth, 'pt');
    // O idioma é assíncrono: a sessão pode ter mudado enquanto aguardávamos.
    if (uidEsperado && (auth.currentUser?.uid !== uidEsperado || auth.currentUser.email?.trim() !== email.trim())) {
      throw { code: 'auth/reset-session-changed' };
    }
    await sendPasswordResetEmail(auth, email.trim());
  }
  finally { redefinicaoEmAndamento = false; }
}

export async function recuperarSenha(email: string): Promise<void> {
  try { await enviarRedefinicaoSenha(email); }
  catch (e) {
    // Mantém a mesma resposta mesmo em projetos sem proteção de enumeração.
    if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'auth/user-not-found') return;
    throw e;
  }
}

export async function recuperarSenhaDaConta(uidEsperado: string): Promise<void> {
  const user = obterAuth().currentUser;
  if (!user || !uidEsperado || user.uid !== uidEsperado) throw { code: 'auth/reset-session-changed' };
  if (!user.email || validarEmailRecuperacao(user.email)) throw { code: 'auth/reset-email-unavailable' };
  // Não recebe e-mail da tela e não suprime erros exclusivos do fluxo público.
  await enviarRedefinicaoSenha(user.email, uidEsperado);
}

export async function carregarPerfil(conta: ContaAutenticada) {
  const db = obterFirestore();
  // Somente estado confirmado pelo servidor pode liberar o fluxo autenticado.
  const snapshot = await getDocFromServer(doc(db, COLLECTIONS.usuarios, conta.uid));
  if (!snapshot.exists()) return null;
  const perfil = converterPerfil(snapshot.data(), conta);
  const estabelecimentoSnapshot = await getDocFromServer(doc(db, COLLECTIONS.estabelecimentos, perfil.estabelecimentoId));
  if (!estabelecimentoSnapshot.exists()) throw new Error('Estabelecimento inexistente.');
  const estabelecimento = converterEstabelecimento(estabelecimentoSnapshot.data(), perfil.estabelecimentoId, conta.uid);
  return { perfil, estabelecimento };
}

export async function criarEstabelecimento(nome: string): Promise<void> {
  const erro = validarNomeEstabelecimento(nome);
  if (erro) throw new Error(erro);
  const conta = contaAtual();
  if (!conta) throw new Error('Sessão encerrada.');
  const db = obterFirestore();
  // Recuperar confirmação de uma tentativa anterior evita um novo onboarding.
  const existente = await carregarPerfil(conta);
  if (existente) return;
  const estabelecimento = doc(collection(db, COLLECTIONS.estabelecimentos));
  const batch = writeBatch(db);
  batch.set(estabelecimento, {
    id: estabelecimento.id, nome: nome.trim(), criadoEm: serverTimestamp(), criadoPor: conta.uid,
  });
  batch.set(doc(db, COLLECTIONS.usuarios, conta.uid), {
    id: conta.uid, email: conta.email, estabelecimentoId: estabelecimento.id,
  });
  await batch.commit();
}
