import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AppScreen } from '../../components/ui/AppScreen';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { colors, spacing, typography } from '../../theme';
import { recuperarSenha, firebaseNativoDisponivel } from '../../services/firebase/session';
import { validarEmailRecuperacao, mensagemErroRecuperacao, mensagemRecuperacaoEnviada } from '../../utils/auth';

export default function RecuperarSenhaScreen({ navigation }: StackScreenProps<AuthStackParamList, 'RecuperarSenha'>) {
  const [email, setEmail] = useState(''), [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false), [enviado, setEnviado] = useState(false);
  const ocupado = useRef(false), ativo = useRef(true);
  const feedback = useFeedback();
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);
  async function enviar() {
    if (ocupado.current || enviado || !firebaseNativoDisponivel) return;
    const validacao = validarEmailRecuperacao(email);
    if (validacao) { setErro(validacao); return; }
    ocupado.current = true; setEnviando(true); setErro(null); Keyboard.dismiss();
    try { await recuperarSenha(email); if (ativo.current) { setEnviado(true); feedback(mensagemRecuperacaoEnviada); } }
    catch (e) { if (ativo.current) { const mensagem = mensagemErroRecuperacao(e); setErro(mensagem); feedback(mensagem, 'error'); } }
    finally { ocupado.current = false; if (ativo.current) setEnviando(false); }
  }
  return <AppScreen>
    <SectionHeader title="Recuperar senha" subtitle="Informe o e-mail utilizado na sua conta para receber instruções." />
    <AppCard><View style={styles.form}>
      {!firebaseNativoDisponivel ? <Text style={styles.text}>A recuperação de senha está disponível no aplicativo Android.</Text> : null}
      {enviado ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.text}>{mensagemRecuperacaoEnviada}</Text> : <>
        <AppInput label="E-mail" accessibilityLabel="E-mail para recuperação" value={email} onChangeText={t => { setEmail(t); setErro(null); }}
          autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email"
          editable={!enviando && firebaseNativoDisponivel} error={erro ?? undefined} returnKeyType="send" onSubmitEditing={() => { void enviar(); }} />
        <AppButton label={enviando ? 'Enviando...' : 'Enviar instruções'} disabled={enviando || !firebaseNativoDisponivel}
          loading={enviando} onPress={() => { void enviar(); }} />
      </>}
      <AppButton variant="text" label="Voltar ao Login" onPress={() => navigation.goBack()} />
    </View></AppCard>
  </AppScreen>;
}
const styles = StyleSheet.create({ form: { gap: spacing.lg }, text: { ...typography.body, color: colors.textSecondary } });
