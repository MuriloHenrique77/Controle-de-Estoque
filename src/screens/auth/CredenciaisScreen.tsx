import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../components/ui/AppScreen';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { colors, spacing, typography } from '../../theme';
import { cadastrar, entrar, firebaseNativoDisponivel } from '../../services/firebase/session';
import { mensagemErroFirebase, validarCadastro, validarCredenciais } from '../../utils/auth';

export default function CredenciaisScreen({ cadastro, alternar, recuperar }: { cadastro: boolean; alternar: () => void; recuperar?: () => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const feedback = useFeedback();
  const ocupado = useRef(false);
  const ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);

  async function enviar() {
    if (ocupado.current || !firebaseNativoDisponivel) return;
    const validacao = cadastro ? validarCadastro(email, senha, confirmacao) : validarCredenciais(email, senha);
    if (validacao) { setErro(validacao); return; }
    ocupado.current = true;
    setEnviando(true);
    setErro(null);
    Keyboard.dismiss();
    try { await (cadastro ? cadastrar(email, senha) : entrar(email, senha)); }
    catch (e) { if (ativo.current) { const mensagem = mensagemErroFirebase(e); setErro(mensagem); feedback(mensagem, 'error'); } }
    finally { ocupado.current = false; if (ativo.current) setEnviando(false); }
  }

  const desabilitado = enviando || !firebaseNativoDisponivel;
  return <AppScreen><SectionHeader title={cadastro ? 'Criar conta' : 'Entrar'}
    subtitle={cadastro ? 'Crie sua conta. O estabelecimento será configurado no próximo passo.' : 'Entre para acessar seu estabelecimento.'} />
    <AppCard><View style={styles.form}>
    {erro ? <Text accessibilityRole="alert" style={styles.error}>{erro}</Text> : null}
    {!firebaseNativoDisponivel ? <Text style={styles.text}>A autenticação Firebase nativa não está disponível na versão web de desenvolvimento. Use uma development build Android.</Text> : null}
    <AppInput label="E-mail" value={email} onChangeText={setEmail}
      autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!desabilitado} />
    <AppInput label="Senha" value={senha} onChangeText={setSenha}
      secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={cadastro ? 'new-password' : 'current-password'} editable={!desabilitado} />
    {cadastro ? <>
      <AppInput label="Confirmar senha" value={confirmacao} onChangeText={setConfirmacao}
        secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" editable={!desabilitado} />
    </> : null}
    <AppButton loading={enviando} label={enviando ? 'Aguarde...' : cadastro ? 'Criar conta' : 'Entrar'} onPress={() => { void enviar(); }} disabled={desabilitado} />
    {!cadastro && recuperar ? <AppButton variant="text" label="Esqueci minha senha?" onPress={recuperar} disabled={enviando} /> : null}
    <AppButton variant="text" label={cadastro ? 'Já tenho uma conta' : 'Criar uma conta'} onPress={alternar} disabled={enviando} />
    </View></AppCard>
  </AppScreen>;
}

const styles = StyleSheet.create({ form: { gap: spacing.lg }, text: { ...typography.body, color: colors.textSecondary }, error: { ...typography.body, color: colors.danger } });
