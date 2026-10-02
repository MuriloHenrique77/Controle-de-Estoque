import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Venda } from '../types/vendaTypes';
import { getVendas } from '../storage/vendasStorage';
import styles from '../styles/styles';

export default function Relatorio() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    carregarVendas();
  }, []);

  async function carregarVendas() {
    const lista = await getVendas();
    setVendas(lista);
  }

  const totalVendas = vendas.length;
  const valorTotal = vendas.reduce((acc, venda) => acc + venda.valor, 0);
  const quantidadeTotal = vendas.reduce(
    (acc, venda) => acc + venda.quantidade,
    0
  );

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
        Relatório de Vendas
      </Text>

      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <View
          style={{
            flex: 1,
            minWidth: 140,
            backgroundColor: '#eff6ff',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 14, color: '#1e3a8a' }}>
            Total de vendas
          </Text>
          <Text
            style={{ fontSize: 18, fontWeight: 'bold', color: '#1d4ed8' }}
          >
            {totalVendas}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('QuantidadeDetalhe' as never)}
          style={{
            flex: 1,
            minWidth: 140,
            backgroundColor: '#ecfdf3',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 14, color: '#166534' }}>
            Quantidade total
          </Text>
          <Text
            style={{ fontSize: 18, fontWeight: 'bold', color: '#16a34a' }}
          >
            {quantidadeTotal}
          </Text>
          <Text style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
            Toque para ver por produto
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            minWidth: 140,
            backgroundColor: '#fef3c7',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 14, color: '#92400e' }}>
            Valor total (R$)
          </Text>
          <Text
            style={{ fontSize: 18, fontWeight: 'bold', color: '#b45309' }}
          >
            {valorTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.vendasContainer}>
        <Text style={styles.vendasTitle}>Vendas registradas</Text>

        {vendas.length === 0 ? (
          <Text style={{ marginTop: 8 }}>Nenhuma venda encontrada.</Text>
        ) : (
          vendas.map((venda) => (
            <View key={venda.id} style={styles.vendaCard}>
              <View style={styles.vendaHeader}>
                <Text style={styles.vendaNome}>{venda.nomeProduto}</Text>
              </View>

              <Text style={styles.vendaTexto}>
                Quantidade: {venda.quantidade}
              </Text>
              <Text style={styles.vendaTexto}>
                Valor: R$ {venda.valor.toFixed(2)}
              </Text>
              {venda.descricao ? (
                <Text style={styles.vendaTexto}>
                  Descrição: {venda.descricao}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}