import type { StockScreenProps } from '../../navigation/types';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { AuthFormLayout, FormButton, authStyles } from '../../components/AuthFormLayout';
import { criarProduto, atualizarProduto } from '../../services/produtos/produtosService';
import { lerQuantidadeFormulario, normalizarEdicaoProduto, mensagemErroProdutos } from '../../utils/produtos';
import { useSession } from '../../session/SessionProvider';
import { useFeedback } from '../../components/ui/FeedbackProvider';

export default function ProdutoFormScreen({ navigation, route }: StockScreenProps<'ProdutoForm'>) {
  const { setor, produto } = route.params;
  const { estado } = useSession();
  const feedback = useFeedback();
  const contexto = estado.status === 'authenticatedReady'
    ? { uid: estado.conta.uid, estabelecimentoId: estado.perfil.estabelecimentoId } : null;
  const valido = contexto !== null && setor.estabelecimentoId === contexto.estabelecimentoId &&
    (!produto || (produto.estabelecimentoId === contexto.estabelecimentoId && produto.setorId === setor.id));
  const [nome, setNome] = useState(produto?.nome ?? '');
  const [descricao, setDescricao] = useState(produto?.descricao ?? '');
  const [quantidadeInicial, setQuantidadeInicial] = useState('0');
  const [estoqueMinimo, setEstoqueMinimo] = useState(produto?.estoqueMinimo?.toString() ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const ocupado = useRef(false);
  const ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);

  async function salvar() {
    if (ocupado.current || !contexto || !valido) return;
    let dados;
    let inicial = 0;
    try {
      dados = normalizarEdicaoProduto({ nome, descricao,
        estoqueMinimo: estoqueMinimo.trim() ? lerQuantidadeFormulario(estoqueMinimo, 'O estoque mínimo') : undefined });
      if (!produto) inicial = lerQuantidadeFormulario(quantidadeInicial, 'A quantidade inicial');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Verifique os dados.'); return; }
    ocupado.current = true;
    setErro(null);
    setSalvando(true);
    try {
      if (produto) await atualizarProduto(contexto, produto.id, dados);
      else await criarProduto(contexto, setor.id, { ...dados, quantidadeInicial: inicial });
      if (ativo.current) {
        feedback(produto ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
        navigation.goBack();
      }
    } catch (e) { if (ativo.current) setErro(mensagemErroProdutos(e)); }
    finally { ocupado.current = false; if (ativo.current) setSalvando(false); }
  }

  return <AuthFormLayout title={produto ? 'Editar produto' : 'Novo produto'} subtitle={`Setor: ${setor.nome}`}
    erro={valido ? erro : 'Este produto ou setor não pertence à sessão atual.'}>
    <Text style={authStyles.label}>Nome do produto</Text>
    <TextInput accessibilityLabel="Nome do produto" style={authStyles.input} value={nome} onChangeText={t => { setNome(t); setErro(null); }}
      placeholder="Ex: Fertilizante" maxLength={120} editable={!salvando && valido} />
    <Text style={authStyles.label}>Descrição</Text>
    <TextInput accessibilityLabel="Descrição" style={[authStyles.input, { minHeight: 100 }]} value={descricao}
      onChangeText={t => { setDescricao(t); setErro(null); }} placeholder="Opcional" multiline textAlignVertical="top" maxLength={2000}
      editable={!salvando && valido} />
    {produto ? <Text style={authStyles.subtitle}>Quantidade inicial: {produto.quantidadeInicial}. Estoque atual: {produto.estoqueAtual}. Esses valores não são editáveis neste formulário.</Text> : <>
      <Text style={authStyles.label}>Quantidade inicial</Text>
      <TextInput accessibilityLabel="Quantidade inicial" style={authStyles.input} value={quantidadeInicial}
        onChangeText={t => { setQuantidadeInicial(t); setErro(null); }} keyboardType="number-pad" editable={!salvando && valido} />
    </>}
    <Text style={authStyles.label}>Estoque mínimo</Text>
    <TextInput accessibilityLabel="Estoque mínimo" style={authStyles.input} value={estoqueMinimo}
      onChangeText={t => { setEstoqueMinimo(t); setErro(null); }} placeholder="Opcional" keyboardType="number-pad" editable={!salvando && valido} />
    {salvando ? <Text style={authStyles.subtitle}>Aguardando confirmação do servidor. É necessária conexão para salvar as alterações.</Text> : null}
    <FormButton label={salvando ? 'Salvando...' : produto ? 'Salvar alterações' : 'Salvar produto'}
      loading={salvando} disabled={salvando || !valido} onPress={() => { void salvar(); }} />
  </AuthFormLayout>;
}
