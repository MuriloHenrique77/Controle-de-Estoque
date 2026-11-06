import { dadosDeRota } from '../../navigation/dadosDeRota';
import type { StockScreenProps } from '../../navigation/types';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/setoresScreen.styles';
import { removerSetor } from '../../services/setores/setoresService';
import { useSetores } from '../../services/setores/useSetores';
import { mensagemErroSetores } from '../../utils/setores';
import type { Setor } from '../../types/setor.types';
import ConfirmModal from '../../components/ConfirmModal';
import { colors } from '../../theme';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { LoadingState, ErrorState } from '../../components/ui/ScreenState';

export default function SetoresScreen({ navigation }: StockScreenProps<'Setores'>) {
  const { estado, contexto, tentarNovamente } = useSetores();
  const feedback = useFeedback();
  const setores = estado.status === 'data' ? estado.setores : [];
  const [erro, setErro] = useState<string | null>(null);
  const carregando = estado.status === 'loading';
  const [excluindo, setExcluindo] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [setorParaExcluir, setSetorParaExcluir] = useState<Setor | null>(null);
  const ocupado = useRef(false);
  const ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);
  const erroVisivel = erro ?? (estado.status === 'error' ? estado.mensagem : null);

  function handleNovoSetor() {
    navigation.navigate('SetorForm');
  }

  function handleAbrirSetor(setor: Setor) {
    navigation.navigate('Produtos', { setor: dadosDeRota(setor) });
  }

  function handleEditarSetor(setor: Setor) {
    navigation.navigate('SetorForm', { setor: dadosDeRota(setor) });
  }

  function handleExcluirSetor(setor: Setor) {
    if (ocupado.current) return;
    setSetorParaExcluir(setor);
    setModalVisible(true);
  }

  async function confirmarExclusao() {
    if (!setorParaExcluir || !contexto || ocupado.current) return;
    ocupado.current = true;
    setExcluindo(true);
    setErro(null);
    try {
      await removerSetor(contexto, setorParaExcluir.id);
      if (ativo.current) feedback('Setor excluído com sucesso.');
    } catch (error) {
      if (ativo.current) setErro(mensagemErroSetores(error));
    } finally {
      ocupado.current = false;
      if (ativo.current) {
        setModalVisible(false);
        setSetorParaExcluir(null);
        setExcluindo(false);
      }
    }
  }

  function cancelarExclusao() {
    if (ocupado.current) return;
    setModalVisible(false);
    setSetorParaExcluir(null);
  }

  function renderSetor({ item }: { item: Setor }) {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardMainArea}
          accessibilityRole="button" accessibilityLabel={`Abrir setor ${item.nome}`}
          activeOpacity={0.7}
          onPress={() => handleAbrirSetor(item)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="grid-outline" size={22} color={colors.primary} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{item.nome}</Text>
            <Text style={styles.cardDescription}>
              {item.descricao ? item.descricao : 'Sem descrição'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            accessibilityLabel={`Editar setor ${item.nome}`}
            accessibilityRole="button"
            onPress={() => handleEditarSetor(item)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            accessibilityLabel={`Excluir setor ${item.nome}`}
            accessibilityRole="button"
            onPress={() => handleExcluirSetor(item)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>Nenhum setor cadastrado</Text>
        <Text style={styles.emptyText}>
          Crie seu primeiro setor para começar a organizar suas informações.
        </Text>

        <TouchableOpacity
          accessibilityRole="button" style={styles.emptyButton}
          activeOpacity={0.8}
          onPress={handleNovoSetor}
        >
          <Text style={styles.emptyButtonText}>Criar primeiro setor</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Setores</Text>
          <Text style={styles.subtitle}>
            Escolha um setor para acessar suas informações
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button" style={styles.newButton}
          activeOpacity={0.8}
          onPress={handleNovoSetor}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
          <Text style={styles.newButtonText}>Novo setor</Text>
        </TouchableOpacity>

        {carregando ? <LoadingState /> : null}
        {erroVisivel ? <ErrorState message={erroVisivel} retry={() => { setErro(null); tentarNovamente(); }} /> : null}

        <FlatList
          data={setores}
          keyExtractor={(item) => item.id}
          renderItem={renderSetor}
          contentContainerStyle={[
            styles.listContent,
            setores.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={carregando || erroVisivel ? null : renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <ConfirmModal
        visible={modalVisible}
        busy={excluindo}
        title="Excluir setor"
        message={
          setorParaExcluir
            ? `Deseja realmente excluir o setor "${setorParaExcluir.nome}"?${excluindo ? ' Aguardando confirmação; sem conexão, a exclusão fica pendente de sincronização.' : ''}`
            : ''
        }
        confirmText={excluindo ? 'Excluindo...' : 'Excluir'}
        cancelText="Cancelar"
        onConfirm={confirmarExclusao}
        onCancel={cancelarExclusao}
      />
    </SafeAreaView>
  );
}
