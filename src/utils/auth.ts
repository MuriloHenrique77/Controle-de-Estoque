export function validarCredenciais(email: string, senha: string): string | null {
  const erroEmail = validarEmailRecuperacao(email);
  if (erroEmail) return erroEmail;
  if (!senha) return 'Informe sua senha.';
  return null;
}

export function validarEmailRecuperacao(email: string): string | null {
  if (!email.trim()) return 'Informe seu e-mail.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Informe um e-mail válido.';
  return null;
}

export const mensagemRecuperacaoEnviada = 'Se existir uma conta com este e-mail, enviaremos instruções para redefinir sua senha.';
export const mensagemRecuperacaoContaEnviada = 'Enviamos as instruções de redefinição de senha para seu e-mail.';

export function mensagemErroRecuperacaoConta(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro ? String(erro.code) : '';
  if (codigo === 'auth/reset-email-unavailable') return 'Não foi possível identificar o e-mail desta conta.';
  if (codigo === 'auth/reset-session-changed') return 'Sua sessão mudou. Entre novamente para redefinir sua senha.';
  if (codigo === 'auth/network-request-failed') return 'Não foi possível enviar o e-mail. Verifique sua conexão e tente novamente.';
  if (codigo === 'auth/invalid-email' || codigo === 'auth/too-many-requests' || codigo === 'auth/request-in-progress' ||
      codigo === 'app/web-unavailable' || codigo === 'auth/internal-error' || codigo === 'auth/operation-not-allowed' || codigo === 'auth/app-not-authorized') {
    return mensagemErroRecuperacao(erro);
  }
  return 'Não foi possível enviar as instruções de redefinição. Tente novamente.';
}

export function mensagemErroRecuperacao(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro ? String(erro.code) : '';
  if (codigo === 'auth/network-request-failed') return 'É necessária conexão para enviar as instruções de redefinição.';
  if (codigo === 'auth/invalid-email' || codigo === 'auth/too-many-requests') return mensagemErroFirebase(erro);
  if (codigo === 'auth/request-in-progress') return 'Aguarde o envio das instruções em andamento.';
  if (codigo === 'app/web-unavailable' || codigo === 'auth/internal-error' || codigo === 'auth/operation-not-allowed' || codigo === 'auth/app-not-authorized') {
    return 'A recuperação de senha está indisponível no momento. Tente novamente mais tarde.';
  }
  return 'Não foi possível enviar as instruções. Tente novamente mais tarde.';
}

export function validarCadastro(email: string, senha: string, confirmacao: string): string | null {
  const erro = validarCredenciais(email, senha);
  if (erro) return erro;
  if (senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
  if (!confirmacao) return 'Confirme sua senha.';
  if (senha !== confirmacao) return 'As senhas não coincidem.';
  return null;
}

export function validarNomeEstabelecimento(nome: string): string | null {
  if (!nome.trim()) return 'Informe o nome do estabelecimento.';
  if (nome.trim().length > 120) return 'O nome deve ter no máximo 120 caracteres.';
  return null;
}

export function mensagemErroFirebase(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro
    ? String(erro.code) : '';
  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'E-mail ou senha inválidos.';
    case 'auth/invalid-email': return 'Informe um e-mail válido.';
    case 'auth/email-already-in-use': return 'Este e-mail já possui uma conta. Faça login.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements': return 'A senha não atende aos requisitos de segurança. Use uma senha mais forte.';
    case 'auth/too-many-requests': return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    case 'auth/user-disabled': return 'Esta conta está desativada.';
    case 'auth/network-request-failed':
    case 'firestore/unavailable':
    case 'unavailable': return 'Verifique sua conexão e tente novamente.';
    case 'firestore/permission-denied':
    case 'permission-denied': return 'Não foi possível acessar os dados da sua conta. Tente novamente.';
    case 'app/web-unavailable': return 'A autenticação Firebase nativa está disponível apenas no aplicativo Android. Use uma development build.';
    default: return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
