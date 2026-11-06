import type { ContaAutenticada } from '../../types/session.types';
import type { Usuario } from '../../types/usuario.types';
import type { Estabelecimento } from '../../types/estabelecimento.types';

// Fallback explícito de desenvolvimento: não inclui SDK nem libera o estoque.
export const firebaseNativoDisponivel = false;
const indisponivel = () => Object.assign(new Error('Firebase nativo indisponível na web.'), { code: 'app/web-unavailable' });
export function contaAtual(): ContaAutenticada | null { return null; }
export function observarAutenticacao(next: (conta: ContaAutenticada | null) => void): () => void {
  next(null);
  return () => {};
}
export async function entrar(_email: string, _senha: string): Promise<void> { throw indisponivel(); }
export async function cadastrar(_email: string, _senha: string): Promise<void> { throw indisponivel(); }
export async function sair(): Promise<void> { throw indisponivel(); }
export async function recuperarSenha(_email: string): Promise<void> { throw indisponivel(); }
export async function recuperarSenhaDaConta(_uidEsperado: string): Promise<void> { throw indisponivel(); }
export async function carregarPerfil(_conta: ContaAutenticada): Promise<{ perfil: Usuario; estabelecimento: Estabelecimento } | null> { throw indisponivel(); }
export async function criarEstabelecimento(_nome: string): Promise<void> { throw indisponivel(); }
