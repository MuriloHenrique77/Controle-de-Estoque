import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StockScreenProps } from '../../navigation/types';
import { useVisaoEstoque } from '../../services/visaoEstoque/useVisaoEstoque';
import { produtoAtivo } from '../../utils/cicloProduto';
import { dadosDeRota } from '../../navigation/dadosDeRota';
import { colors, radii, spacing, touchTarget, typography } from '../../theme';
import { AppScreen } from '../../components/ui/AppScreen';
import { AppInput } from '../../components/ui/AppInput';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { SectionHeader } from '../../components/ui/SectionHeader';

export default function SelecaoEstoqueScreen({ navigation, route }: StockScreenProps<'SelecaoEstoque'>) {
  const { acao } = route.params;
  const { estado, estabelecimentoId, tentarNovamente } = useVisaoEstoque(5);
  const [busca, setBusca] = useState('');
  useEffect(() => { setBusca(''); }, [acao]);
  const dados = estado.status === 'data' ? estado.dados : undefined;
  const setores = useMemo(() => new Map(dados?.setores.map(s => [s.id, s])), [dados]);
  const produtos = useMemo(() => new Map(dados?.produtos.map(p => [p.id, p])), [dados]);
  const itens = useMemo(() => (acao === 'produto' ? dados?.setores ?? [] : dados?.produtos.filter(produtoAtivo) ?? [])
    .filter(item => item.estabelecimentoId === estabelecimentoId && item.nome.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')))
    .slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [acao, dados, estabelecimentoId, busca]);
  return <AppScreen scroll={false}><FlatList data={itens} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}
    ListHeaderComponent={<View style={styles.header}><SectionHeader title={acao === 'produto' ? 'Escolha o setor' : 'Escolha o produto'}
      subtitle={acao === 'produto' ? 'O novo produto será cadastrado neste setor.' : `Selecione um produto para registrar uma ${acao === 'entrada' ? 'entrada' : 'saída'}.`} />
      <AppInput label={acao === 'produto' ? 'Buscar setor' : 'Buscar produto'} value={busca} onChangeText={setBusca} /></View>}
    renderItem={({ item }) => {
      const produto = produtos.get(item.id);
      const setor = acao === 'produto' ? setores.get(item.id) : produto ? setores.get(produto.setorId) : undefined;
      if (!setor) return null;
      return <Pressable accessibilityRole="button" accessibilityLabel={`Selecionar ${item.nome}`} style={styles.item} onPress={() => {
        if (acao === 'produto') navigation.navigate('ProdutoForm', { setor: dadosDeRota(setor) });
        else if (produto) navigation.navigate('MovimentacaoForm', { setor: dadosDeRota(setor), produtoId: produto.id, tipo: acao });
      }}><Text style={styles.title}>{item.nome}</Text>
        {produto && acao !== 'produto' ? <Text style={styles.caption}>{setor.nome} • Estoque: {produto.estoqueAtual}</Text> : null}</Pressable>;
    }}
    ListEmptyComponent={estado.status === 'loading' ? <LoadingState /> : estado.status === 'error' ? <ErrorState message={estado.mensagem} retry={tentarNovamente} />
      : <EmptyState title={busca.trim() ? 'Nenhum resultado' : acao === 'produto' ? 'Cadastre um setor primeiro' : 'Nenhum produto ativo'}
        message={busca.trim() ? 'Experimente buscar outro nome.' : acao === 'produto' ? 'Abra Estoque para organizar seus setores.' : 'Cadastre ou reative um produto em Estoque para registrar movimentações.'}
        action="Abrir setores" onAction={() => navigation.navigate('Setores')} />} />
  </AppScreen>;
}
const styles = StyleSheet.create({ list: { flexGrow: 1, paddingBottom: spacing.xxl }, header: { marginBottom: spacing.lg },
  item: { minHeight: touchTarget, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radii.md, padding: spacing.lg, marginBottom: spacing.md },
  title: { ...typography.label, color: colors.text }, caption: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs } });
