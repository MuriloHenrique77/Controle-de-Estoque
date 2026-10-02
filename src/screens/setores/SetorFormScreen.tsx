import React, { useEffect, useState } from 'react';
import {View, Text, TextInput, Alert, TouchableOpacity,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { styles } from '../../styles/setorFormScreen.styles';
import { criarSetor, atualizarSetor } from '../../storage/setoresStorage';
import { Setor } from '../../types/setor.types';

export default function SetorFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const setorEmEdicao: Setor | undefined = route.params?.setor;

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    if (setorEmEdicao) {
      setNome(setorEmEdicao.nome);
      setDescricao(setorEmEdicao.descricao || '');
    }
  }, [setorEmEdicao]);

  async function handleSalvar() {
    const nomeTratado = nome.trim();
    const descricaoTratada = descricao.trim();

    if (!nomeTratado) {
      Alert.alert('Atenção', 'Informe o nome do setor.');
      return;
    }

    if (setorEmEdicao) {
      const setorAtualizado: Setor = {
        ...setorEmEdicao,
        nome: nomeTratado,
        descricao: descricaoTratada,
      };

      await atualizarSetor(setorAtualizado);
      Alert.alert('Sucesso', 'Setor atualizado com sucesso!');
      navigation.goBack();
      return;
    }

    const novoSetor: Setor = {
      id: Date.now().toString(),
      nome: nomeTratado,
      descricao: descricaoTratada,
      criadoEm: new Date().toISOString(),
    };

    await criarSetor(novoSetor);
    Alert.alert('Sucesso', 'Setor criado com sucesso!');
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {setorEmEdicao ? 'Editar setor' : 'Novo setor'}
        </Text>

        <Text style={styles.subtitle}>
          {setorEmEdicao
            ? 'Atualize as informações do setor'
            : 'Crie um setor para organizar suas informações separadamente'}
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nome do setor</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Arc Raiders"
            placeholderTextColor="#999"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Opcional"
            placeholderTextColor="#999"
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.8}
            onPress={handleSalvar}
          >
            <Text style={styles.saveButtonText}>
              {setorEmEdicao ? 'Salvar alterações' : 'Salvar setor'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}