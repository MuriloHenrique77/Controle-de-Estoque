import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AuthenticatedTabParamList } from '../../navigation/types';
import { useSession } from '../../session/SessionProvider';
import { useVisaoEstoque } from '../../services/visaoEstoque/useVisaoEstoque';
import { resumirHome } from '../../utils/visaoEstoque';
import { colors, spacing, typography } from '../../theme';
import { AppScreen } from '../../components/ui/AppScreen';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function HomeScreen({ navigation }: BottomTabScreenProps<AuthenticatedTabParamList, 'Inicio'>) {
  const { estado: sessao } = useSession();
  const { estado, estabelecimentoId, tentarNovamente } = useVisaoEstoque(0);
  const dados = estado.status === 'data' ? estado.dados : undefined;
  const resumo = useMemo(() => dados ? resumirHome(estabelecimentoId, dados) : undefined, [dados, estabelecimentoId]);
  const selecionar = (acao: 'produto' | 'entrada' | 'saida') => navigation.navigate('Estoque', { screen: 'SelecaoEstoque', params: { acao }, initial: false });
  return <AppScreen>
    <Text style={styles.caption}>Bem-vindo ao seu estoque</Text>
    <Text style={styles.title}>{sessao.status === 'authenticatedReady' ? sessao.estabelecimento.nome : 'Seu estabelecimento'}</Text>
    <Text style={styles.caption}>Acompanhe o estoque e organize o próximo passo.</Text>
    {estado.status === 'loading' ? <LoadingState /> : null}
    {estado.status === 'error' ? <ErrorState message={estado.mensagem} retry={tentarNovamente} /> : null}
    {dados && resumo ? <>
      {dados.emCache ? <Text style={styles.cache}>Dados salvos no dispositivo. Aguardando sincronização.</Text> : null}
      <SectionHeader title="Resumo do estoque" />
      <View style={styles.grid}>{[
        ['Produtos', resumo.totalProdutos], ['Setores', resumo.totalSetores],
        ['Reposição', resumo.totalReposicao], ['Estoque zerado', resumo.totalZerados],
      ].map(([label, value]) => <AppCard key={label} style={styles.metric}>
        <Text style={styles.caption}>{label}</Text><Text style={styles.number}>{value}</Text>
      </AppCard>)}</View>
      {resumo.totalReposicao || resumo.totalZerados ? <>
        <SectionHeader title="Atenção" /><AppCard style={styles.attention}>
          {resumo.totalReposicao ? <StatusBadge tone="warning" label={`${resumo.totalReposicao} ${resumo.totalReposicao === 1 ? 'produto precisa' : 'produtos precisam'} de reposição`} /> : null}
          {resumo.totalZerados ? <StatusBadge tone="danger" label={`${resumo.totalZerados} ${resumo.totalZerados === 1 ? 'produto está zerado' : 'produtos estão zerados'}`} /> : null}
          <AppButton variant="text" label="Consultar no relatório" onPress={() => navigation.navigate('Relatorios')} />
        </AppCard></> : null}
      <SectionHeader title="Ações rápidas" />
      <View style={styles.actions}><AppButton label="Novo produto" onPress={() => selecionar('produto')} />
        <View style={styles.actionRow}><View style={styles.action}><AppButton variant="secondary" label="Entrada" onPress={() => selecionar('entrada')} /></View>
          <View style={styles.action}><AppButton variant="secondary" label="Saída" onPress={() => selecionar('saida')} /></View></View></View>
    </> : null}
  </AppScreen>;
}
const styles = StyleSheet.create({ title: { ...typography.title, color: colors.text, marginVertical: spacing.sm },
  caption: { ...typography.caption, color: colors.textSecondary }, number: { ...typography.number, color: colors.text, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, metric: { width: '47%', flexGrow: 1 },
  attention: { gap: spacing.sm }, actions: { gap: spacing.md }, actionRow: { flexDirection: 'row', gap: spacing.md }, action: { flex: 1 },
  cache: { ...typography.caption, color: colors.warning, marginTop: spacing.lg } });
