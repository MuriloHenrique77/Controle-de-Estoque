import AsyncStorage from '@react-native-async-storage/async-storage';
import { Produto } from '../types/produto.types';

const STORAGE_KEY = '@produtos';

export async function listarProdutos(): Promise<Produto[]> {
  try {
    const dados = await AsyncStorage.getItem(STORAGE_KEY);

    if (!dados) {
      return [];
    }

    return JSON.parse(dados);
  } catch (error) {
    console.log('Erro ao listar produtos:', error);
    return [];
  }
}

export async function salvarProdutos(produtos: Produto[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(produtos));
  } catch (error) {
    console.log('Erro ao salvar produtos:', error);
  }
}

export async function criarProduto(novoProduto: Produto): Promise<void> {
  try {
    const produtosAtuais = await listarProdutos();
    const novaLista = [...produtosAtuais, novoProduto];
    await salvarProdutos(novaLista);
  } catch (error) {
    console.log('Erro ao criar produto:', error);
  }
}

export async function listarProdutosPorSetor(setorId: string): Promise<Produto[]> {
  try {
    const produtos = await listarProdutos();
    return produtos.filter((produto) => produto.setorId === setorId);
  } catch (error) {
    console.log('Erro ao listar produtos por setor:', error);
    return [];
  }
}