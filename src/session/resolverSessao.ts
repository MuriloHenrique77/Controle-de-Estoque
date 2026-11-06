import type { ContaAutenticada, SessionState } from '../types/session.types';
import type { Usuario } from '../types/usuario.types';
import type { Estabelecimento } from '../types/estabelecimento.types';
import { mensagemErroFirebase } from '../utils/auth';

export async function resolverSessao(
  conta: ContaAutenticada | null,
  carregar: (conta: ContaAutenticada) => Promise<{ perfil: Usuario; estabelecimento: Estabelecimento } | null>,
): Promise<SessionState> {
  if (!conta) return { status: 'unauthenticated' };
  try {
    const dados = await carregar(conta);
    return dados ? { status: 'authenticatedReady', conta, ...dados }
      : { status: 'authenticatedWithoutProfile', conta };
  } catch (erro) {
    return { status: 'error', mensagem: mensagemErroFirebase(erro) };
  }
}
