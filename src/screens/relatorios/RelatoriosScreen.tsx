import { dadosDeRota } from '../../navigation/dadosDeRota';
import { produtoAtivo } from '../../utils/cicloProduto';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthenticatedTabParamList } from '../../navigation/types';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { Produto } from '../../types/produto.types';
import type { TipoMovimentacao } from '../../types/movimentacao.types';
import type { MovimentoRelatorio } from '../../types/relatorio.types';
import { useRelatorios } from '../../services/relatorios/useRelatorios';
import { agregarRelatorio, mensagemErroRelatorio } from '../../utils/relatorios';
import { construirIntervaloRelatorio, formatarDiaLocal, periodoPadrao } from '../../utils/periodoRelatorio';
import { formatarDataRelatorio as data, formatarQuantidadeRelatorio as numero } from '../../utils/formatarRelatorio';
import { authStyles, FormButton } from '../../components/AuthFormLayout';
import { useHeaderHeight } from '@react-navigation/elements';
import { colors, radii, spacing, touchTarget, typography } from '../../theme';
import { LoadingState } from '../../components/ui/ScreenState';
import FiltroSelecao from '../../components/FiltroSelecao';
import { VendedorLinha } from '../../components/ui/VendedorLinha';

type Linha =
  | { id: string; tipo: 'movimento'; registro: MovimentoRelatorio }
  | { id: string; tipo: 'produto'; produto: Produto; setor: string; descricao: string }
  | { id: string; tipo: 'setor'; nome: string; entradas: number; saidas: number };
type Secao = { titulo: string; descricao: string; vazio: string; data: Linha[] };
const chave = (linha: Linha) => linha.id;

const LinhaResultado = memo(function LinhaResultado({ item, abrir }: { item: Linha; abrir: (p: Produto) => void }) {
  if (item.tipo === 'setor') return <View style={styles.card}>
    <Text style={styles.nome}>{item.nome}</Text>
    <Text style={styles.texto}>Entradas: {numero(item.entradas)} • Saídas: {numero(item.saidas)}</Text>
  </View>;
  const produto = item.tipo === 'produto' ? item.produto : item.registro.produto;
  return <View style={styles.card}>
    <Text style={styles.nome}>{produto?.nome ?? 'Produto indisponível'}</Text>
    <Text style={styles.texto}>Setor: {item.tipo === 'produto' ? item.setor : item.registro.setor?.nome ?? 'Setor indisponível'}</Text>
    {item.tipo === 'produto' ? <Text style={styles.texto}>{item.descricao}</Text> : <>
      <Text style={[styles.tipo, item.registro.movimento.tipo === 'entrada' ? styles.entrada : styles.saida]}>
        {item.registro.movimento.tipo === 'entrada' ? 'Entrada +' : 'Saída -'}{numero(item.registro.movimento.quantidade)}
      </Text>
      <Text style={styles.texto}>{data(item.registro.movimento.criadoEm)}</Text>
      <Text style={styles.texto}>{item.registro.movimento.observacao || 'Sem observação'}</Text>
      <VendedorLinha movimento={item.registro.movimento} />
    </>}
    {produto ? <Pressable accessibilityRole="button" accessibilityLabel={'Ver detalhes de ' + produto.nome}
      style={styles.detalhes} onPress={() => abrir(produto)}><Text style={styles.link}>Ver detalhes do produto</Text></Pressable> : null}
  </View>;
});

export default function RelatoriosScreen({ navigation }: BottomTabScreenProps<AuthenticatedTabParamList, 'Relatorios'>) {
  const headerHeight = useHeaderHeight();
  const [padrao] = useState(periodoPadrao);
  const [inicial, setInicial] = useState(padrao.inicial), [final, setFinal] = useState(padrao.final);
  const [periodo, setPeriodo] = useState(() => construirIntervaloRelatorio(padrao.inicial, padrao.final));
  const [erroPeriodo, setErroPeriodo] = useState<string | null>(null);
  const [setorId, setSetorId] = useState<string>(), [produtoId, setProdutoId] = useState<string>();
  const [tipo, setTipo] = useState<TipoMovimentacao>();
  const { estado, estabelecimentoId, tentarNovamente } = useRelatorios(periodo);
  const dados = estado.status === 'data' ? estado.dados : undefined;
  const calculo = useMemo(() => {
    if (!dados) return {};
    try { return { resultado: agregarRelatorio(estabelecimentoId, dados, { ...periodo, setorId, produtoId, tipo }) }; }
    catch (e) { return { erro: mensagemErroRelatorio(e) }; }
  }, [dados, estabelecimentoId, periodo, setorId, produtoId, tipo]);
  const resultado = calculo.resultado;
  const produtos = useMemo(() => dados?.produtos.filter(p => !setorId || p.setorId === setorId)
    .slice().sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR')) ?? [], [dados, setorId]);
  const setores = useMemo(() => dados?.setores.slice().sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR')) ?? [], [dados]);
  const abrir = useCallback((produto: Produto) => {
    const setor = dados?.setores.find(s => s.id === produto.setorId);
    if (setor && produto.estabelecimentoId === estabelecimentoId && setor.estabelecimentoId === estabelecimentoId) {
      navigation.navigate('Estoque', { screen: 'ProdutoDetalhes', params: { setor: dadosDeRota(setor), produtoId: produto.id }, initial: false });
    }
  }, [navigation, dados, estabelecimentoId]);
  const renderItem = useCallback(({ item }: { item: Linha }) => <LinhaResultado item={item} abrir={abrir} />, [abrir]);
  const secoes = useMemo<Secao[]>(() => {
    if (!resultado) return [];
    const setorNome = (p: Produto) => resultado.setorPorId.get(p.setorId)?.nome ?? 'Setor indisponível';
    const produtoLinha = (p: Produto, prefixo: string, descricao: string): Linha => ({ tipo: 'produto', produto: p, setor: setorNome(p), id: prefixo + p.id, descricao });
    return [
      { titulo: 'Entradas e saídas por setor', descricao: 'Totais do período com todos os filtros aplicados.', vazio: 'Nenhum setor movimentado para os filtros selecionados.',
        data: resultado.porSetor.map(s => ({ tipo: 'setor', id: 'setor:' + s.setorId, nome: s.nome, entradas: s.entradas, saidas: s.saidas })) },
      { titulo: 'Maior entrada', descricao: 'Total de entradas por produto, do maior para o menor. Empates ordenados pelo nome.', vazio: 'Nenhuma entrada para os filtros selecionados.',
        data: resultado.maioresEntradas.map((r,i) => produtoLinha(r.produto, 'entrada:', (i + 1) + 'º • Total de entradas: ' + numero(r.quantidade))) },
      { titulo: 'Maior saída', descricao: 'Total de saídas por produto, do maior para o menor. Empates ordenados pelo nome.', vazio: 'Nenhuma saída para os filtros selecionados.',
        data: resultado.maioresSaidas.map((r,i) => produtoLinha(r.produto, 'saida:', (i + 1) + 'º • Total de saídas: ' + numero(r.quantidade))) },
      { titulo: 'Produtos sem movimentação', descricao: 'Produtos ativos sem entrada nem saída no período. Respeita setor e produto; independe do filtro de tipo.',
        vazio: produtos.some(p => produtoAtivo(p) && (!produtoId || p.id === produtoId)) ? 'Todos os produtos ativos tiveram movimentação no período.' : 'Nenhum produto ativo para esta seleção.',
        data: resultado.semMovimentacao.map(p => produtoLinha(p, 'sem:', 'Estoque atual: ' + numero(p.estoqueAtual))) },
      { titulo: 'Produtos para reposição', descricao: 'Produtos ativos com estoque atual menor ou igual ao mínimo definido. Período e tipo não se aplicam.', vazio: 'Nenhum produto ativo precisa de reposição.',
        data: resultado.reposicao.map(p => produtoLinha(p, 'reposicao:', 'Estoque atual: ' + numero(p.estoqueAtual) + ' • Mínimo: ' + numero(p.estoqueMinimo ?? 0))) },
      { titulo: 'Estoque zerado', descricao: 'Estado atual dos produtos ativos. Respeita setor e produto; período e tipo não se aplicam.', vazio: 'Nenhum produto ativo com estoque zerado.',
        data: resultado.zerados.map(p => produtoLinha(p, 'zero:', 'Estoque atual: 0')) },
      { titulo: 'Movimentações do período', descricao: 'Mais recentes primeiro, com todos os filtros aplicados.', vazio: 'Nenhuma movimentação encontrada para os filtros selecionados.',
        data: resultado.movimentos.map(registro => ({ tipo: 'movimento', registro, id: 'movimento:' + registro.movimento.id })) },
    ];
  }, [resultado, produtos, produtoId]);
  function aplicarPeriodo() {
    try { setPeriodo(construirIntervaloRelatorio(inicial, final)); setErroPeriodo(null); }
    catch (e) { setErroPeriodo(mensagemErroRelatorio(e)); }
  }
  function limpar() {
    const novo = periodoPadrao();
    setInicial(novo.inicial); setFinal(novo.final); setPeriodo(construirIntervaloRelatorio(novo.inicial, novo.final));
    setSetorId(undefined); setProdutoId(undefined); setTipo(undefined); setErroPeriodo(null);
  }
  const ultimoDia = new Date(periodo.fimExclusivo.getFullYear(), periodo.fimExclusivo.getMonth(), periodo.fimExclusivo.getDate() - 1);
  const cabecalho = <View>
    <Text style={styles.titulo}>Relatórios</Text>
    <Text style={styles.texto}>Analise quantidades por período e o estoque atual.</Text>
    <Text style={authStyles.label}>Data inicial (DD/MM/AAAA)</Text>
    <TextInput accessibilityLabel="Data inicial" style={authStyles.input} value={inicial} maxLength={10}
      placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" onChangeText={t => { setInicial(t); setErroPeriodo(null); }} />
    <Text style={authStyles.label}>Data final (DD/MM/AAAA)</Text>
    <TextInput accessibilityLabel="Data final" style={authStyles.input} value={final} maxLength={10}
      placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" onChangeText={t => { setFinal(t); setErroPeriodo(null); }} />
    <Text style={styles.texto}>Inclui todo o último dia, no fuso horário deste dispositivo.</Text>
    {erroPeriodo ? <Text accessibilityRole="alert" style={authStyles.error}>{erroPeriodo}</Text> : null}
    <FormButton label="Aplicar período" onPress={aplicarPeriodo} />
    <FiltroSelecao titulo="Setor" todos="Todos os setores" opcoes={setores} valor={setorId} disabled={!dados}
      onChange={id => { setSetorId(id); setProdutoId(undefined); }} />
    <FiltroSelecao titulo="Produto" todos="Todos os produtos" opcoes={produtos} valor={produtoId} disabled={!dados} onChange={setProdutoId} />
    <Text style={authStyles.label}>Tipo de movimentação</Text>
    <View style={styles.tipos}>
      {([{ valor: undefined, nome: 'Todos' }, { valor: 'entrada', nome: 'Entrada' }, { valor: 'saida', nome: 'Saída' }] as const).map(o =>
        <Pressable key={o.nome} accessibilityRole="button" accessibilityLabel={'Tipo: ' + o.nome}
          accessibilityState={{ selected: tipo === o.valor }} style={[styles.opcaoTipo, tipo === o.valor ? styles.selecionado : null]}
          onPress={() => setTipo(o.valor)}><Text style={tipo === o.valor ? styles.selecionadoTexto : styles.link}>{o.nome}</Text></Pressable>)}
    </View>
    <FormButton label="Limpar filtros" link onPress={limpar} />
    <Text style={styles.periodo}>Período aplicado: {formatarDiaLocal(periodo.inicio)} a {formatarDiaLocal(ultimoDia)}</Text>
    {estado.status === 'loading' ? <LoadingState /> : null}
    {estado.status === 'error' || calculo.erro ? <View>
      <Text accessibilityRole="alert" style={authStyles.error}>{estado.status === 'error' ? estado.mensagem : calculo.erro}</Text>
      <FormButton label="Tentar novamente" onPress={tentarNovamente} />
    </View> : null}
    {dados?.emCache ? <Text style={styles.aviso}>Dados em cache ou aguardando sincronização. Podem estar desatualizados ou incompletos.</Text> : null}
    {resultado ? <>
      <Text style={styles.subtitulo}>Resumo de movimentações</Text>
      <View style={styles.resumo}>
        {[
          ['Total de entradas', resultado.resumo.totalEntradas], ['Total de saídas', resultado.resumo.totalSaidas],
          ['Saldo do período', resultado.resumo.saldoPeriodo], ['Movimentações', resultado.resumo.quantidadeMovimentacoes],
          ['Produtos movimentados', resultado.resumo.produtosMovimentados],
        ].map(([label, valor]) => {
          const formatado = numero(Number(valor));
          return <View key={label} style={[styles.metrica, formatado.length > 8 && styles.metricaAmpla]}
            accessible accessibilityLabel={label + ': ' + formatado}>
            <Text style={styles.texto}>{label}</Text>
            <Text style={styles.valor} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{formatado}</Text>
          </View>;
        })}
      </View>
      <Text style={styles.texto}>Saldo do período = entradas − saídas. Esse valor não representa necessariamente o estoque atual. Produtos movimentados são produtos distintos.</Text>
    </> : null}
  </View>;
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.area}>
    <KeyboardAvoidingView style={styles.area} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}>
      <SectionList<Linha, Secao> sections={secoes} keyExtractor={chave} renderItem={renderItem}
        contentContainerStyle={styles.conteudo} ListHeaderComponent={cabecalho} stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled" initialNumToRender={10}
        renderSectionHeader={({ section }) => <View style={styles.secao}>
          <Text style={styles.subtitulo}>{section.titulo}</Text><Text style={styles.texto}>{section.descricao}</Text>
          {!section.data.length ? <Text style={styles.vazio}>{section.vazio}{dados?.emCache ? ' O cache pode estar incompleto.' : ''}</Text> : null}
        </View>} />
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  area: { flex: 1, backgroundColor: colors.background }, conteudo: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  titulo: { ...typography.title, color: colors.text, marginBottom: spacing.md },
  subtitulo: { ...typography.cardTitle, color: colors.text, marginBottom: spacing.sm },
  texto: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }, periodo: { ...typography.label, color: colors.text, marginBottom: spacing.lg },
  aviso: { ...typography.body, color: colors.warning, backgroundColor: colors.warningSoft, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.lg },
  tipos: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }, opcaoTipo: { flex: 1, minHeight: touchTarget, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', padding: spacing.sm }, selecionado: { backgroundColor: colors.primary },
  selecionadoTexto: { ...typography.label, color: colors.surface }, link: { ...typography.label, color: colors.primary },
  resumo: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  metrica: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radii.lg },
  metricaAmpla: { flexBasis: '100%' },
  valor: { ...typography.number, color: colors.primary }, secao: { marginTop: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  nome: { ...typography.cardTitle, color: colors.text, marginBottom: spacing.sm },
  tipo: { ...typography.cardTitle, marginBottom: spacing.sm }, entrada: { color: colors.primary }, saida: { color: colors.danger },
  detalhes: { minHeight: touchTarget, justifyContent: 'center', marginTop: spacing.xs }, vazio: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
});
