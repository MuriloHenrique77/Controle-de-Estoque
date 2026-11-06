import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import type { StockScreenProps } from '../../navigation/types';
import { AuthFormLayout, FormButton, authStyles } from '../../components/AuthFormLayout';
import { useProdutos } from '../../services/produtos/useProdutos';
import { produtoAtivo } from '../../utils/cicloProduto';
import { useSession } from '../../session/SessionProvider';
import { lerQuantidadeFormulario } from '../../utils/produtos';
import { normalizarMovimentacao, mensagemErroMovimentacao } from '../../utils/movimentacoes';
import { registrarEntrada, registrarSaida, editarMovimentacao } from '../../services/movimentacoes/movimentacoesService';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { AppInput } from '../../components/ui/AppInput';
import { AppCheckbox } from '../../components/ui/AppCheckbox';

export default function MovimentacaoFormScreen({ route, navigation }: StockScreenProps<'MovimentacaoForm'>) {
  const { produtoId, setor, tipo, movimentacao } = route.params;
  const { estado } = useSession();
  const feedback = useFeedback();
  const contexto = estado.status === 'authenticatedReady' ? { uid: estado.conta.uid, estabelecimentoId: estado.perfil.estabelecimentoId } : null;
  const produtos = useProdutos(setor.id);
  const produto = produtos.estado.status === 'data' ? produtos.estado.produtos.find(p => p.id === produtoId) : undefined;
  const valido = contexto !== null && contexto.estabelecimentoId === setor.estabelecimentoId && !!produto && produtoAtivo(produto);
  const [quantidade, setQuantidade] = useState(movimentacao ? String(movimentacao.quantidade) : '');
  const [observacao, setObservacao] = useState(movimentacao?.observacao ?? '');
  const [adicionarVendedor, setAdicionarVendedor] = useState(tipo === 'saida' && !!movimentacao?.vendedorNome);
  const [vendedorNome, setVendedorNome] = useState(movimentacao?.vendedorNome ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const ocupado = useRef(false), ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);
  async function salvar() {
    if (ocupado.current || !contexto || !valido) return;
    let dados;
    try { dados = normalizarMovimentacao({ quantidade: lerQuantidadeFormulario(quantidade, 'A quantidade'), observacao,
      ...(tipo === 'saida' && adicionarVendedor ? { vendedorNome } : {}) }, tipo); }
    catch (e) { setErro(mensagemErroMovimentacao(e, !!movimentacao)); return; }
    ocupado.current = true; setSalvando(true); setErro(null);
    try {
      if (movimentacao) await editarMovimentacao(contexto, produtoId, setor.id, movimentacao.id, dados);
      else if (tipo === 'entrada') await registrarEntrada(contexto, produtoId, setor.id, { quantidade: dados.quantidade, observacao: dados.observacao });
      else await registrarSaida(contexto, produtoId, setor.id, dados);
      if (ativo.current) {
        feedback(movimentacao ? 'Movimentação atualizada com sucesso.' : tipo === 'entrada' ? 'Entrada registrada com sucesso.' : 'Saída registrada com sucesso.');
        navigation.goBack();
      }
    } catch (e) { if (ativo.current) setErro(mensagemErroMovimentacao(e, !!movimentacao)); }
    finally { ocupado.current = false; if (ativo.current) setSalvando(false); }
  }
  return <AuthFormLayout title={movimentacao ? (tipo === 'entrada' ? 'Editar entrada' : 'Editar saída') : (tipo === 'entrada' ? 'Registrar entrada' : 'Registrar saída')}
    subtitle={movimentacao ? 'É necessária conexão para alterar movimentações. O tipo permanece imutável.' : 'É necessária conexão para registrar esta movimentação. O estoque será validado ao confirmar.'}
    erro={valido ? erro : produto?.status === 'inativo' ? 'Produto inativo. Reative-o para alterar movimentações.' : produtos.estado.status === 'loading' ? null : 'Produto indisponível nesta sessão.'}>
    <Text style={authStyles.subtitle}>Produto: {produto?.nome ?? 'Carregando produto...'}{`\n`}Tipo: {tipo === 'entrada' ? 'Entrada' : 'Saída'}</Text>
    <Text style={authStyles.label}>Quantidade</Text>
    <TextInput accessibilityLabel="Quantidade" value={quantidade} onChangeText={t => { setQuantidade(t); setErro(null); }} style={authStyles.input}
      keyboardType="number-pad" placeholder="Maior que zero" editable={!salvando && valido} />
    <Text style={authStyles.label}>Observação</Text>
    <TextInput accessibilityLabel="Observação" value={observacao} onChangeText={t => { setObservacao(t); setErro(null); }} style={[authStyles.input, { minHeight: 100 }]}
      multiline textAlignVertical="top" maxLength={2000} placeholder="Opcional" editable={!salvando && valido} />
    {tipo === 'saida' ? <>
      <AppCheckbox label="Adicionar vendedor" checked={adicionarVendedor} disabled={salvando || !valido}
        onChange={checked => { setAdicionarVendedor(checked); setErro(null); }} />
      {adicionarVendedor ? <AppInput label="Nome do vendedor" value={vendedorNome}
        onChangeText={nome => { setVendedorNome(nome); setErro(null); }} editable={!salvando && valido}
        autoCapitalize="none" keyboardType="default" placeholder="Até 80 caracteres" /> : null}
    </> : null}
    {salvando ? <Text style={authStyles.subtitle}>Aguardando confirmação do servidor...</Text> : null}
    <FormButton label={salvando ? 'Salvando...' : movimentacao ? 'Salvar alterações' : tipo === 'entrada' ? 'Confirmar entrada' : 'Confirmar saída'}
      loading={salvando} onPress={() => { void salvar(); }} disabled={salvando || !valido} />
  </AuthFormLayout>;
}
