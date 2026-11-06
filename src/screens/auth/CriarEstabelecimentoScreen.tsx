import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { AuthFormLayout, FormButton, authStyles } from '../../components/AuthFormLayout';
import { criarEstabelecimento } from '../../services/firebase/session';
import { useSession } from '../../session/SessionProvider';
import { mensagemErroFirebase, validarNomeEstabelecimento } from '../../utils/auth';

export default function CriarEstabelecimentoScreen() {
  const { atualizarPerfil } = useSession();
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const ocupado = useRef(false);
  const ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);

  async function enviar() {
    if (ocupado.current) return;
    const validacao = validarNomeEstabelecimento(nome);
    if (validacao) { setErro(validacao); return; }
    ocupado.current = true;
    setEnviando(true);
    setErro(null);
    try { await criarEstabelecimento(nome); if (ativo.current) await atualizarPerfil(); }
    catch (e) { if (ativo.current) setErro(mensagemErroFirebase(e)); }
    finally { ocupado.current = false; if (ativo.current) setEnviando(false); }
  }

  return <AuthFormLayout title="Criar estabelecimento" erro={erro}
    subtitle="Sua conta está criada. Conclua este passo para acessar o aplicativo. Se sair agora, poderá continuar ao entrar novamente.">
    <Text style={authStyles.label}>Nome do estabelecimento</Text>
    <TextInput accessibilityLabel="Nome do estabelecimento" style={authStyles.input} value={nome} onChangeText={t => { setNome(t); setErro(null); }}
      editable={!enviando} maxLength={120} autoCapitalize="words" />
    <Text style={authStyles.subtitle}>É necessária uma conexão para confirmar a configuração. Sua conta será preservada se ocorrer uma falha.</Text>
    <FormButton label={enviando ? 'Configurando...' : 'Criar estabelecimento'} loading={enviando} disabled={enviando} onPress={() => { void enviar(); }} />
  </AuthFormLayout>;
}
