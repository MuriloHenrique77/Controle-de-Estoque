import AsyncStorage from '@react-native-async-storage/async-storage';
import { Venda } from '../types/vendaTypes';

const STORAGE_KEY = '@vendas';

export async function getVendas(): Promise<Venda[]> {
  try {
    const dados = await AsyncStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  } catch (error) {
    console.log('Erro ao buscar vendas:', error);
    return [];
  }
}

export async function saveVendas(lista: Venda[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch (error) {
    console.log('Erro ao salvar vendas:', error);
  }
}

export async function addVenda(novaVenda: Venda): Promise<Venda[]> {
  const vendasAtuais = await getVendas();
  const novaLista = [...vendasAtuais, novaVenda];
  await saveVendas(novaLista);
  return novaLista;
}

export async function deleteVenda(id: string): Promise<Venda[]> {
  const vendasAtuais = await getVendas();
  const novaLista = vendasAtuais.filter((venda) => venda.id !== id);
  await saveVendas(novaLista);
  return novaLista;
}