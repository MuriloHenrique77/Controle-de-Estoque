import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { styles } from '../../styles/setoresScreen.styles';
import { listarSetores, removerSetor } from '../../storage/setoresStorage';
import { Setor } from '../../types/setor.types';
import ConfirmModal from '../../components/ConfirmModal';

export default function SetoresScreen() {
  const navigation = useNavigation<any>();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [setorParaExcluir, setSetorParaExcluir] = useState<Setor | null>(null);  

  function handleNovoSetor() {
    navigation.navigate('SetorForm');
  }

  function handleAbrirSetor(setor: Setor) {
    navigation.navigate('Produtos', { setor });
  }

  function handleEditarSetor(setor: Setor) {
    navigation.navigate('SetorForm', { setor });
  }

  async function carregarSetores() {
    const lista = await listarSetores();
    setSetores(lista);
  }

  useFocusEffect(
    useCallback(() => {
      carregarSetores();
    }, [])
  );

    function handleExcluirSetor(setor: Setor) {
    setSetorParaExcluir(setor);
    setModalVisible(true);
    }

    async function confirmarExclusao() {
        if (!setorParaExcluir) {
            return;
        }

        await removerSetor(setorParaExcluir.id);
        await carregarSetores();

        setModalVisible(false);
        setSetorParaExcluir(null);
    }
    
    function cancelarExclusao() {
        setModalVisible(false);
        setSetorParaExcluir(null);
    }

  function renderSetor({ item }: { item: Setor }) {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardMainArea}
          activeOpacity={0.7}
          onPress={() => handleAbrirSetor(item)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="grid-outline" size={22} color="#1E88E5" />
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
            onPress={() => handleEditarSetor(item)}
          >
            <Ionicons name="create-outline" size={20} color="#F57C00" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => handleExcluirSetor(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-open-outline" size={64} color="#B0BEC5" />
        <Text style={styles.emptyTitle}>Nenhum setor cadastrado</Text>
        <Text style={styles.emptyText}>
          Crie seu primeiro setor para começar a organizar suas informações.
        </Text>

        <TouchableOpacity
          style={styles.emptyButton}
          activeOpacity={0.8}
          onPress={handleNovoSetor}
        >
          <Text style={styles.emptyButtonText}>Criar primeiro setor</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Setores</Text>
          <Text style={styles.subtitle}>
            Escolha um setor para acessar suas informações
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newButton}
          activeOpacity={0.8}
          onPress={handleNovoSetor}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={styles.newButtonText}>Novo setor</Text>
        </TouchableOpacity>

        <FlatList
          data={setores}
          keyExtractor={(item) => item.id}
          renderItem={renderSetor}
          contentContainerStyle={[
            styles.listContent,
            setores.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <ConfirmModal
          visible={modalVisible}
          title="Excluir setor"
          message={
            setorParaExcluir
            ? `Deseja realmente excluir o setor "${setorParaExcluir.nome}"?`
            : ''
        }
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={confirmarExclusao}
          onCancel={cancelarExclusao}
        />
    </SafeAreaView>
  );
}