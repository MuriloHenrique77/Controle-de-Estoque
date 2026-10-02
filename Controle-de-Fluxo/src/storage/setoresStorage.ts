import AsyncStorage from '@react-native-async-storage/async-storage';
import { Setor } from '../types/setor.types';

const STORAGE_KEY = '@setores';

export async function listarSetores(): Promise<Setor[]> {
  try {
    const dados = await AsyncStorage.getItem(STORAGE_KEY);

    if (!dados) {
      return [];
    }

    return JSON.parse(dados);
  } catch (error) {
    console.log('Erro ao listar setores:', error);
    return [];
  }
}

export async function salvarSetores(setores: Setor[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(setores));
  } catch (error) {
    console.log('Erro ao salvar setores:', error);
  }
}

export async function criarSetor(novoSetor: Setor): Promise<void> {
  try {
    const setoresAtuais = await listarSetores();
    const novaLista = [...setoresAtuais, novoSetor];
    await salvarSetores(novaLista);
  } catch (error) {
    console.log('Erro ao criar setor:', error);
  }
}

export async function removerSetor(id: string): Promise<void> {
  try {
    const setoresAtuais = await listarSetores();
    const novaLista = setoresAtuais.filter((setor) => setor.id !== id);
    await salvarSetores(novaLista);
  } catch (error) {
    console.log('Erro ao remover setor:', error);
  }
}

export async function atualizarSetor(setorAtualizado: Setor): Promise<void> {
  try {
    const setoresAtuais = await listarSetores();

    const novaLista = setoresAtuais.map((setor) =>
      setor.id === setorAtualizado.id ? setorAtualizado : setor
    );

    await salvarSetores(novaLista);
  } catch (error) {
    console.log('Erro ao atualizar setor:', error);
  }
}