import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { criarProduto } from '../../storage/produtosStorage';
import { Produto } from '../../types/produto.types';
import { Setor } from '../../types/setor.types';
import { styles } from '../../styles/produtoFormScreen.styles';

export default function ProdutoFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const setor: Setor = route.params?.setor;

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');

  function validarFormulario() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do produto.');
      return false;
    }

    if (!quantidade.trim()) {
      Alert.alert('Atenção', 'Informe a quantidade.');
      return false;
    }

    if (isNaN(Number(quantidade))) {
      Alert.alert('Atenção', 'A quantidade deve ser numérica.');
      return false;
    }

    return true;
  }

  async function handleSalvar() {
    if (!validarFormulario()) {
      return;
    }

    const novoProduto: Produto = {
      id: Date.now().toString(),
      setorId: setor.id,
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      quantidade: Number(quantidade),
      criadoEm: new Date().toISOString(),
    };

    await criarProduto(novoProduto);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.setorLabel}>Setor selecionado</Text>
            <Text style={styles.setorNome}>{setor.nome}</Text>

            <Text style={styles.label}>Nome do produto</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Fertilizante, Controle Xbox..."
              style={styles.input}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descrição opcional"
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />

            <Text style={styles.label}>Quantidade</Text>
            <TextInput
              value={quantidade}
              onChangeText={setQuantidade}
              placeholder="0"
              keyboardType="numeric"
              style={styles.input}
            />

            <TouchableOpacity
              onPress={handleSalvar}
              activeOpacity={0.8}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Salvar produto</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}