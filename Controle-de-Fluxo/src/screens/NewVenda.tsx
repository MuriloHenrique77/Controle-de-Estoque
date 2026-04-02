import { TouchableOpacity, View, Text, TextInput} from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import GenericModal from '../components/GenericModal';
import { Venda } from '../types/vendaTypes';
import { getVendas, addVenda, deleteVenda } from '../storage/vendasStorage';
import styles from '../styles/styles';


export default function NewVenda() {
  const [visible, setVisible] = useState(false);

  const [nomeProduto, setNomeProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');

  const [vendas, setVendas] = useState<Venda[]>([]);

  useEffect(() => {
  carregarLista();
}, []);

async function carregarLista() {
  const lista = await getVendas();
  setVendas(lista);
}   

  function openModal() {
    setVisible(true);
    setErro('');
  }

  function closeModal() {
    setVisible(false);
    setErro('');
  }

  function limparCampos() {
    setNomeProduto('');
    setQuantidade('');
    setValor('');
    setDescricao('');
    setErro('');
  }

  async function salvarVenda() {
    setErro('');

    if (!nomeProduto.trim()) {
      setErro('Informe o nome do produto.');
      return;
    }

    if (!quantidade.trim()) {
      setErro('Informe a quantidade da venda.');
      return;
    }

    if (!valor.trim()) {
      setErro('Informe o valor da venda.');
      return;
    }

    const valorNumerico = Number(valor.replace(',', '.'));
    const quantidadeNumerica = Number(quantidade);

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor válido para a venda.');
      return;
    }

    if (isNaN(quantidadeNumerica) || quantidadeNumerica <= 0) {
      setErro('Informe uma quantidade válida.');
      return;
    }

    const novaVenda: Venda = {
      id: Date.now().toString(),
      nomeProduto: nomeProduto.trim(),
      valor: valorNumerico,
      quantidade: quantidadeNumerica,
      data: new Date().toISOString(),
      descricao: descricao.trim() || undefined,
    };

    const listaAtualizada = await addVenda(novaVenda);

    setVendas(listaAtualizada);
    limparCampos();
    closeModal();
  }

  async function excluirVenda(id: string) {
    const listaAtualizada = await deleteVenda(id);
    setVendas(listaAtualizada);
  }

  function editarVenda(id: string) {
    const vendaSelecionada = vendas.find((venda) => venda.id === id);

    if (!vendaSelecionada) return;

    setNomeProduto(vendaSelecionada.nomeProduto);
    setQuantidade(String(vendaSelecionada.quantidade));
    setValor(String(vendaSelecionada.valor));
    setDescricao(vendaSelecionada.descricao || '');
    setVisible(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
        Tela de Vendas
      </Text>

      <TouchableOpacity
        onPress={openModal}
        style={{
          backgroundColor: '#1d4ed8',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
          Nova Venda
        </Text>
      </TouchableOpacity>

      <GenericModal
        visible={visible}
        onClose={closeModal}
        onSave={salvarVenda}
        text="Cadastrar venda"
      >
        <View style={{ width: '100%' }}>
          {erro ? (
            <Text
              style={{
                color: '#dc2626',
                backgroundColor: '#fee2e2',
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {erro}
            </Text>
          ) : null}

          <Text style={{ marginBottom: 6 }}>Nome do produto</Text>
          <TextInput
            placeholder="Ex: sementes"
            value={nomeProduto}
            onChangeText={setNomeProduto}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
            }}
          />

          <Text style={{ marginBottom: 6 }}>Quantidade</Text>
          <TextInput
            placeholder="Ex: 1"
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
            }}
          />

          <Text style={{ marginBottom: 6 }}>Valor</Text>
          <TextInput
            placeholder="Ex: 25.50"
            value={valor}
            onChangeText={setValor}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
            }}
          />

          <Text style={{ marginBottom: 6 }}>Descrição</Text>
          <TextInput
            placeholder="Opcional"
            value={descricao}
            onChangeText={setDescricao}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
          />
        </View>
      </GenericModal>

    <View style={styles.vendasContainer}>
      <Text style={styles.vendasTitle}>Vendas salvas</Text>

      {vendas.map((venda) => (
        <View key={venda.id} style={styles.vendaCard}>
  <View style={styles.vendaHeader}>
    <Text style={styles.vendaNome}>{venda.nomeProduto}</Text>

    <View style={styles.acoesContainer}>
      <TouchableOpacity
        onPress={() => editarVenda(venda.id)}
        style={styles.acaoBotao}
      >
        <Ionicons name="create-outline" size={20} color="#2563eb" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => excluirVenda(venda.id)}
        style={styles.acaoBotao}
      >
        <Ionicons name="trash-outline" size={20} color="#dc2626" />
      </TouchableOpacity>
    </View>
  </View>

  <Text style={styles.vendaTexto}>Quantidade: {venda.quantidade}</Text>
  <Text style={styles.vendaTexto}>Valor: R$ {venda.valor.toFixed(2)}</Text>
  {venda.descricao ? (
    <Text style={styles.vendaTexto}>Descrição: {venda.descricao}</Text>
  ) : null}
</View>

      ))}
    </View>
    </SafeAreaView>
  );
}
