import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listarProdutosPorSetor } from '../../storage/produtosStorage';
import { Produto } from '../../types/produto.types';
import { Setor } from '../../types/setor.types';

export default function ProdutosScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const setor: Setor = route.params?.setor;

  const [produtos, setProdutos] = useState<Produto[]>([]);

  function handleNovoProduto() {
    navigation.navigate('ProdutoForm', { setor });
  }

  async function carregarProdutos() {
    const lista = await listarProdutosPorSetor(setor.id);
    setProdutos(lista);
  }

  useFocusEffect(
    useCallback(() => {
      carregarProdutos();
    }, [setor.id])
  );

  function renderProduto({ item }: { item: Produto }) {
    return (
      <View
        style={{
          backgroundColor: '#FFF',
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#E5E5E5',
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#111' }}>
          {item.nome}
        </Text>

        <Text style={{ marginTop: 4, fontSize: 14, color: '#666' }}>
          {item.descricao ? item.descricao : 'Sem descrição'}
        </Text>

        <Text style={{ marginTop: 8, fontSize: 14, color: '#1E88E5' }}>
          Quantidade: {item.quantidade}
        </Text>
      </View>
    );
  }

  function renderEmptyState() {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Ionicons name="cube-outline" size={64} color="#B0BEC5" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 22,
            fontWeight: '700',
            color: '#222',
            textAlign: 'center',
          }}
        >
          Nenhum produto cadastrado
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 15,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          Adicione produtos para este setor.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#111' }}>
            {setor.nome}
          </Text>
          <Text style={{ marginTop: 6, fontSize: 15, color: '#666' }}>
            Produtos cadastrados neste setor
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#1E88E5',
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          activeOpacity={0.8}
          onPress={handleNovoProduto}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
            Novo produto
          </Text>
        </TouchableOpacity>

        <FlatList
          data={produtos}
          keyExtractor={(item) => item.id}
          renderItem={renderProduto}
          contentContainerStyle={{
            paddingBottom: 20,
            flexGrow: produtos.length === 0 ? 1 : 0,
          }}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}