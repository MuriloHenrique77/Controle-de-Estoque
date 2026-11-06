import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AuthenticatedTabParamList } from '../../navigation/types';
import { useVisaoEstoque } from '../../services/visaoEstoque/useVisaoEstoque';
import { listarMovimentosGlobais } from '../../utils/visaoEstoque';
import type { MovimentoGlobal } from '../../types/visaoEstoque.types';
import { dadosDeRota } from '../../navigation/dadosDeRota';
import { colors, spacing, typography } from '../../theme';
import { AppScreen } from '../../components/ui/AppScreen';
import { AppButton } from '../../components/ui/AppButton';
import { MovimentoCard } from '../../components/MovimentoCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { SectionHeader } from '../../components/ui/SectionHeader';
const chave = (r: MovimentoGlobal) => r.movimento.id;
export default function MovimentacoesScreen({ navigation }: BottomTabScreenProps<AuthenticatedTabParamList, 'Movimentacoes'>) {
  const [limite, setLimite] = useState(50);
  const { estado, estabelecimentoId, tentarNovamente } = useVisaoEstoque(limite);
  const dados = estado.status === 'data' ? estado.dados : undefined;
  const movimentos = useMemo(() => dados ? listarMovimentosGlobais(estabelecimentoId, dados) : [], [dados, estabelecimentoId]);
  const renderItem = useCallback(({ item }: { item: MovimentoGlobal }) => <MovimentoCard registro={item}
    abrir={item.produto && item.setor ? () => navigation.navigate('Estoque', { screen: 'ProdutoDetalhes',
      params: { setor: dadosDeRota(item.setor!), produtoId: item.produto!.id }, initial: false }) : undefined} />, [navigation]);
  return <AppScreen scroll={false}><FlatList data={movimentos} keyExtractor={chave} renderItem={renderItem} contentContainerStyle={styles.list}
    ListHeaderComponent={<><SectionHeader title="Movimentações" subtitle="Entradas e saídas do seu estabelecimento, mais recentes primeiro." />
      {dados?.emCache ? <Text style={styles.cache}>Dados salvos no dispositivo. Aguardando sincronização.</Text> : null}</>}
    ListEmptyComponent={estado.status === 'loading' ? <LoadingState /> : estado.status === 'error'
      ? <ErrorState message={estado.mensagem} retry={tentarNovamente} />
      : <EmptyState title="Sem movimentações" message="Escolha um produto na aba Estoque para registrar uma entrada ou saída." />}
    ListFooterComponent={dados && movimentos.length >= limite ? <AppButton variant="secondary" label="Carregar mais movimentações" onPress={() => setLimite(v => v + 50)} /> : null} />
  </AppScreen>;
}
const styles = StyleSheet.create({ list: { flexGrow: 1, paddingBottom: spacing.xxl }, cache: { ...typography.caption, color: colors.warning, marginBottom: spacing.md } });
