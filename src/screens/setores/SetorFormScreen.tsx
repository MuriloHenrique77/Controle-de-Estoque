import type { StockScreenProps } from '../../navigation/types';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { AuthFormLayout, FormButton, authStyles } from '../../components/AuthFormLayout';
import { criarSetor, atualizarSetor } from '../../services/setores/setoresService';
import { normalizarDadosSetor, mensagemErroSetores } from '../../utils/setores';
import { useSession } from '../../session/SessionProvider';

export default function SetorFormScreen({ navigation, route }: StockScreenProps<'SetorForm'>) {
  const setor = route.params?.setor;
  const feedback = useFeedback();
  const { estado } = useSession();
  const contexto = estado.status === 'authenticatedReady'
    ? { uid: estado.conta.uid, estabelecimentoId: estado.perfil.estabelecimentoId } : null;
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState(setor?.nome ?? '');
  const [descricao, setDescricao] = useState(setor?.descricao ?? '');
  const ocupado = useRef(false);
  const ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);
  const contextoValido = contexto !== null && (!setor || setor.estabelecimentoId === contexto.estabelecimentoId);

  async function handleSalvar() {
    if (ocupado.current || !contexto || !contextoValido) return;
    let dados;
    try { dados = normalizarDadosSetor({ nome, descricao }); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Verifique os dados do setor.'); return; }
    ocupado.current = true;
    setErro(null);
    setSalvando(true);
    try {
      if (setor) await atualizarSetor(contexto, setor.id, dados);
      else await criarSetor(contexto, dados);
      if (!ativo.current) return;
      feedback(setor ? 'Setor atualizado com sucesso.' : 'Setor criado com sucesso.');
      navigation.goBack();
    } catch (e) { if (ativo.current) setErro(mensagemErroSetores(e)); }
    finally { ocupado.current = false; if (ativo.current) setSalvando(false); }
  }

  return <AuthFormLayout title={setor ? 'Editar setor' : 'Novo setor'}
    subtitle={setor ? 'Atualize as informações do setor.' : 'Crie um setor para organizar seu estabelecimento.'}
    erro={contextoValido ? erro : 'Este setor não pertence à sessão atual.'}>
    <Text style={authStyles.label}>Nome do setor</Text>
    <TextInput accessibilityLabel="Nome do setor" style={authStyles.input} placeholder="Ex: Almoxarifado"
      value={nome} onChangeText={t => { setNome(t); setErro(null); }} editable={!salvando && contextoValido} maxLength={120} />
    <Text style={authStyles.label}>Descrição</Text>
    <TextInput accessibilityLabel="Descrição" style={[authStyles.input, { minHeight: 110 }]} placeholder="Opcional"
      value={descricao} onChangeText={t => { setDescricao(t); setErro(null); }} editable={!salvando && contextoValido} maxLength={2000}
      multiline numberOfLines={4} textAlignVertical="top" />
    {salvando ? <Text style={authStyles.subtitle}>Aguardando confirmação. Sem conexão, a alteração fica pendente e será sincronizada quando a rede retornar.</Text> : null}
    <FormButton label={salvando ? 'Salvando...' : setor ? 'Salvar alterações' : 'Salvar setor'}
      loading={salvando} disabled={salvando || !contextoValido} onPress={() => { void handleSalvar(); }} />
  </AuthFormLayout>;
}
