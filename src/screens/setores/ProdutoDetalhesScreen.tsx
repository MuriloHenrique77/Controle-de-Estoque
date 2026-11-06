import { dadosDeRota } from '../../navigation/dadosDeRota';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StockScreenProps } from '../../navigation/types';
import type { Movimentacao } from '../../types/movimentacao.types';
import { useProdutos } from '../../services/produtos/useProdutos';
import { useMovimentacoesProduto } from '../../services/movimentacoes/useMovimentacoesProduto';
import { excluirMovimentacao } from '../../services/movimentacoes/movimentacoesService';
import { mensagemErroMovimentacao } from '../../utils/movimentacoes';
import { ProdutoLifecycleActions } from '../../components/ProdutoLifecycleActions';
import { produtoAtivo } from '../../utils/cicloProduto';
import { colors, radii, spacing, typography } from '../../theme';
import { precisaReposicao } from '../../utils/produtos';
import { FormButton, authStyles } from '../../components/AuthFormLayout';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { LoadingState } from '../../components/ui/ScreenState';
import ConfirmModal from '../../components/ConfirmModal';
import { VendedorLinha } from '../../components/ui/VendedorLinha';

const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const LinhaMovimento = memo(function LinhaMovimento({ item, editar, excluir, disabled }: { item: Movimentacao; editar: (m: Movimentacao) => void; excluir: (m: Movimentacao) => void; disabled: boolean }) {
  return <View style={styles.movimento}>
    <Text style={styles.nome}>{item.tipo === 'entrada' ? 'Entrada' : 'Saída'} {item.tipo === 'entrada' ? '+' : '-'}{item.quantidade}</Text>
    <Text style={styles.texto}>{formatoData.format(item.criadoEm)}</Text>
    <Text style={styles.texto}>{item.observacao || 'Sem observação'}</Text>
    <VendedorLinha movimento={item} />
    <View style={styles.acoes}>
      <View style={styles.acao}><FormButton variant="secondary" label="Editar" disabled={disabled} onPress={() => editar(item)} /></View>
      <View style={styles.acao}><FormButton variant="danger" label="Excluir" disabled={disabled} onPress={() => excluir(item)} /></View>
    </View>
  </View>;
});
const chaveMovimento = (item: Movimentacao) => item.id;

export default function ProdutoDetalhesScreen({ route, navigation }: StockScreenProps<'ProdutoDetalhes'>) {
  const { setor, produtoId } = route.params;
  const feedback = useFeedback();
  const { estado, contexto, tentarNovamente } = useProdutos(setor.id);
  const historico = useMovimentacoesProduto(produtoId, setor.id);
  const valido = contexto?.estabelecimentoId === setor.estabelecimentoId;
  const produto = valido && estado.status === 'data' ? estado.produtos.find(p => p.id === produtoId) : undefined;
  const [excluindo, setExcluindo] = useState(false);
  const [movimentoExcluir, setMovimentoExcluir] = useState<Movimentacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const lista = useRef<FlatList<Movimentacao>>(null);
  const ocupado = useRef(false), ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);
  async function excluirRegistro() {
    if (ocupado.current || !contexto || !produto || !produtoAtivo(produto) || !movimentoExcluir) return;
    ocupado.current = true; setExcluindo(true); setErro(null);
    try { await excluirMovimentacao(contexto, produtoId, setor.id, movimentoExcluir.id); if (ativo.current) feedback('Movimentação excluída. Estoque atualizado.'); }
    catch (e) { if (ativo.current) { setErro(mensagemErroMovimentacao(e, true)); lista.current?.scrollToOffset({ offset: 0, animated: true }); } }
    finally { ocupado.current = false; if (ativo.current) { setMovimentoExcluir(null); setExcluindo(false); } }
  }
  const editarRegistro = useCallback((movimentacao: Movimentacao) => {
    navigation.navigate('MovimentacaoForm', { setor, produtoId, tipo: movimentacao.tipo, movimentacao: dadosDeRota(movimentacao) });
  }, [navigation, setor, produtoId]);
  const renderMovimento = useCallback(({ item }: { item: Movimentacao }) =>
    <LinhaMovimento item={item} editar={editarRegistro} excluir={setMovimentoExcluir} disabled={excluindo || !produto || !valido || !produtoAtivo(produto)} />,
    [editarRegistro, excluindo, produto, valido]);
  const erroLista = estado.status === 'error' ? estado.mensagem : null;
  const movimentos = valido && historico.estado.status === 'data' ? historico.estado.movimentos : [];
  const cabecalho = <View>
    {!valido ? <Text style={authStyles.error}>Produto indisponível nesta sessão.</Text> : null}
    {estado.status === 'loading' ? <LoadingState /> : null}
    {erroLista || erro ? <Text accessibilityRole="alert" style={authStyles.error}>{erro ?? erroLista}</Text> : null}
    {estado.status === 'data' && !produto ? <Text style={styles.texto}>Produto não encontrado.</Text> : null}
    {produto ? <>
      <Text style={styles.texto}>Setor: {setor.nome}</Text>
      <Text style={styles.titulo}>{produto.nome}</Text>
      {produto.status === 'inativo' ? <Text style={styles.texto}>Produto inativo — estoque e histórico preservados</Text> : null}
      <Text style={styles.texto}>{produto.descricao || 'Sem descrição'}</Text>
      <Text style={styles.saldo}>Estoque atual: {produto.estoqueAtual}</Text>
      {produto.estoqueMinimo !== undefined ? <Text style={styles.texto}>Estoque mínimo: {produto.estoqueMinimo}</Text> : null}
      {produtoAtivo(produto) && produto.estoqueAtual === 0 ? <Text style={styles.alerta}>Estoque zerado</Text> : null}
      {produtoAtivo(produto) && precisaReposicao(produto) ? <Text style={styles.alerta}>Necessita reposição</Text> : null}
      <View style={styles.acoes}>
        <View style={styles.acao}><FormButton label="Entrada" disabled={excluindo || !produtoAtivo(produto)} onPress={() => navigation.navigate('MovimentacaoForm', { setor, produtoId, tipo: 'entrada' })} /></View>
        <View style={styles.acao}><FormButton label="Saída" disabled={excluindo || !produtoAtivo(produto)} onPress={() => navigation.navigate('MovimentacaoForm', { setor, produtoId, tipo: 'saida' })} /></View>
      </View>
      <FormButton variant="secondary" label="Editar produto" disabled={excluindo} onPress={() => navigation.navigate('ProdutoForm', { setor, produto: dadosDeRota(produto) })} />
      <ProdutoLifecycleActions produto={produto} contexto={valido ? contexto : null} />
    </> : null}
    <Text style={styles.titulo}>Histórico de movimentações</Text>
    {historico.estado.status === 'loading' ? <LoadingState /> : null}
    {historico.estado.status === 'error' ? <Text accessibilityRole="alert" style={authStyles.error}>{historico.estado.mensagem}</Text> : null}
    {erroLista || historico.estado.status === 'error' ? <FormButton label="Tentar novamente" onPress={() => { tentarNovamente(); historico.tentarNovamente(); }} /> : null}
  </View>;
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.area}>
    <FlatList ref={lista} data={movimentos} renderItem={renderMovimento} keyExtractor={chaveMovimento} contentContainerStyle={styles.conteudo}
      ListHeaderComponent={cabecalho} ListEmptyComponent={historico.estado.status === 'data' ? <Text style={styles.texto}>Nenhuma movimentação registrada.</Text> : null} />
    <ConfirmModal visible={movimentoExcluir !== null} busy={excluindo} title="Excluir movimentação"
      message="Deseja excluir esta movimentação? O estoque do produto será recalculado."
      confirmText={excluindo ? 'Excluindo...' : 'Excluir'}
      onConfirm={() => { void excluirRegistro(); }} onCancel={() => { if (!ocupado.current) setMovimentoExcluir(null); }} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  area: { flex: 1, backgroundColor: colors.background }, conteudo: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  titulo: { color: colors.text, ...typography.title, marginBottom: 12, marginTop: 12 },
  texto: { color: colors.textSecondary, ...typography.body, marginBottom: 8 },
  saldo: { color: colors.primary, ...typography.number, marginVertical: 14 },
  alerta: { color: colors.warning, ...typography.label, marginBottom: 10 },
  acoes: { flexDirection: 'row', gap: 12, marginTop: 12 }, acao: { flex: 1 },
  movimento: { padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.lg, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  nome: { color: colors.text, ...typography.cardTitle, marginBottom: 8 },
});
