import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../session/SessionProvider';
import { recuperarSenhaDaConta } from '../../services/firebase/session';
import { mensagemErroRecuperacao, mensagemErroRecuperacaoConta, mensagemRecuperacaoContaEnviada } from '../../utils/auth';
import { AppScreen } from '../../components/ui/AppScreen';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import ConfirmModal from '../../components/ConfirmModal';
import { colors, spacing, typography } from '../../theme';
import { obterVersaoApp } from '../../utils/versaoApp';

export default function ContaScreen() {
  const { estado, encerrarSessao } = useSession();
  const feedback = useFeedback();
  const [acao, setAcao] = useState<'senha' | 'sair' | null>(null);
  const [enviando, setEnviando] = useState(false);
  const ocupado = useRef(false), ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);
  if (estado.status !== 'authenticatedReady') return null;
  const { conta, estabelecimento } = estado;

  async function confirmar() {
    if (ocupado.current || !acao) return;
    ocupado.current = true; setEnviando(true);
    try {
      if (acao === 'sair') await encerrarSessao();
      else {
        await recuperarSenhaDaConta(conta.uid);
        if (ativo.current) feedback(mensagemRecuperacaoContaEnviada);
      }
    } catch (erro) {
      if (ativo.current) feedback(acao === 'senha' ? mensagemErroRecuperacaoConta(erro) : mensagemErroRecuperacao(erro), 'error');
    } finally {
      ocupado.current = false;
      if (ativo.current) { setEnviando(false); setAcao(null); }
    }
  }
  return <AppScreen>
    <AppCard style={styles.dados}>
      <View style={styles.campo}><Text style={styles.label}>E-mail</Text><Text selectable style={styles.valor}>{conta.email}</Text></View>
      <View style={styles.campo}><Text style={styles.label}>Estabelecimento</Text><Text selectable style={styles.valor}>{estabelecimento.nome}</Text></View>
    </AppCard>
    <SectionHeader title="Segurança" subtitle="Redefina sua senha pelo link enviado por e-mail." />
    <AppButton label="Redefinir senha" variant="secondary" disabled={enviando} loading={enviando && acao === 'senha'} onPress={() => setAcao('senha')} />
    <SectionHeader title="Sessão" />
    <AppButton label="Sair da conta" variant="text" disabled={enviando} loading={enviando && acao === 'sair'} onPress={() => setAcao('sair')} />
    <Text style={styles.versao}>Versão {obterVersaoApp()}</Text>
    <ConfirmModal visible={acao !== null} busy={enviando} destructive={false}
      title={acao === 'sair' ? 'Sair da conta?' : 'Redefinir senha'}
      message={acao === 'sair' ? 'Você precisará entrar novamente para acessar seu estabelecimento.' : 'Enviaremos um link de redefinição para o e-mail da sua conta.'}
      confirmText={enviando ? 'Aguarde...' : acao === 'sair' ? 'Sair' : 'Enviar'}
      onCancel={() => { if (!ocupado.current) setAcao(null); }} onConfirm={() => { void confirmar(); }} />
  </AppScreen>;
}
const styles = StyleSheet.create({ dados: { gap: spacing.xl }, campo: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textSecondary }, valor: { ...typography.body, color: colors.text },
  versao: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxl } });
