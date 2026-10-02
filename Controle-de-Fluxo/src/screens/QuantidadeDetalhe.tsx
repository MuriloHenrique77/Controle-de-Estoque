import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Venda } from '../types/vendaTypes';
import { getVendas } from '../storage/vendasStorage';
import styles from '../styles/styles';

type QuantidadePorProduto = {
  nomeProduto: string;
  quantidadeTotal: number;
};

export default function QuantidadeDetalhe(){
  const [itensAgrupados, setItensAgrupados] = useState<QuantidadePorProduto[]>(
    []
  );

  useEffect(() => {
    carregarQuantidadePorProduto();
  }, []);

  async function carregarQuantidadePorProduto(): Promise<void> {
    const vendas: Venda[] = await getVendas();

    const mapa = new Map<string, number>();

    vendas.forEach((venda: Venda) => {
      const quantidadeAtual = mapa.get(venda.nomeProduto) ?? 0;
      mapa.set(venda.nomeProduto, quantidadeAtual + venda.quantidade);
    });

    const listaAgrupada: QuantidadePorProduto[] = Array.from(
      mapa.entries()
    ).map(([nomeProduto, quantidadeTotal]) => ({
      nomeProduto,
      quantidadeTotal,
    }));

    setItensAgrupados(listaAgrupada);
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
        Quantidade por produto
      </Text>

      <ScrollView style={styles.vendasContainer}>
        {itensAgrupados.length === 0 ? (
          <Text style={{ marginTop: 8 }}>Nenhuma venda encontrada.</Text>
        ) : (
          itensAgrupados.map((item: QuantidadePorProduto) => (
            <View key={item.nomeProduto} style={styles.vendaCard}>
              <Text style={styles.vendaNome}>{item.nomeProduto}</Text>
              <Text style={styles.vendaTexto}>
                Quantidade total vendida: {item.quantidadeTotal}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}