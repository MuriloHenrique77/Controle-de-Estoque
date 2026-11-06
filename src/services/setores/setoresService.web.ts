import type { ContextoSetores, DadosSetor } from '../../utils/setores';
import type { Setor } from '../../types/setor.types';

function indisponivel() { return Object.assign(new Error('Firestore nativo indisponível.'), { code: 'app/web-unavailable' }); }
export function observarSetores(_contexto: ContextoSetores, _receber: (setores: Setor[]) => void,
  erro: (erro: unknown) => void): () => void { erro(indisponivel()); return () => {}; }
export async function criarSetor(_contexto: ContextoSetores, _dados: DadosSetor): Promise<void> { throw indisponivel(); }
export async function atualizarSetor(_contexto: ContextoSetores, _id: string, _dados: DadosSetor): Promise<void> { throw indisponivel(); }
export async function removerSetor(_contexto: ContextoSetores, _id: string): Promise<void> { throw indisponivel(); }
