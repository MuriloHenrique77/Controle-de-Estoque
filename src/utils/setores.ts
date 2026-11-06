import type { Setor } from '../types/setor.types';

export type DadosSetor = { nome: string; descricao?: string };
export type ContextoSetores = { uid: string; estabelecimentoId: string };

export function normalizarDadosSetor(dados: DadosSetor): DadosSetor {
  const nome = dados.nome.trim();
  const descricao = dados.descricao?.trim();
  if (!nome) throw new Error('Informe o nome do setor.');
  if (nome.length > 120) throw new Error('O nome deve ter no máximo 120 caracteres.');
  if (descricao && descricao.length > 2000) throw new Error('A descrição deve ter no máximo 2000 caracteres.');
  return { nome, ...(descricao ? { descricao } : {}) };
}

const comparadorNome = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
export function ordenarSetores(setores: readonly Setor[]): Setor[] {
  return [...setores].sort((a, b) => comparadorNome.compare(a.nome, b.nome) || a.id.localeCompare(b.id));
}

export class SetorComProdutosError extends Error {
  constructor() {
    super('Este setor possui produtos cadastrados, ativos ou inativos. Não é possível excluir o setor enquanto houver produtos vinculados.');
    this.name = 'SetorComProdutosError';
  }
}

export function mensagemErroSetores(erro: unknown): string {
  if (erro instanceof SetorComProdutosError) return erro.message;
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro ? String(erro.code) : '';
  if (codigo === 'app/web-unavailable') return 'Setores no Firestore estão disponíveis apenas no aplicativo Android.';
  if (codigo === 'firestore/unavailable' || codigo === 'unavailable') return 'Verifique sua conexão e tente novamente.';
  return 'Não foi possível concluir a operação de setores. Tente novamente.';
}
