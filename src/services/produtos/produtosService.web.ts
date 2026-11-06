import type { ContextoProdutos, DadosNovoProduto, DadosEdicaoProduto } from '../../utils/produtos';
import type { Produto } from '../../types/produto.types';
function indisponivel() { return Object.assign(new Error('Produtos no Firestore estão disponíveis no aplicativo Android.'), { code: 'app/web-unavailable' }); }
export function observarProdutos(_c: ContextoProdutos, _s: string, _r: (p: Produto[]) => void, erro: (e: unknown) => void): () => void { erro(indisponivel()); return () => {}; }
export async function setorPossuiProdutos(_c: ContextoProdutos, _s: string): Promise<boolean> { throw indisponivel(); }
export async function criarProduto(_c: ContextoProdutos, _s: string, _d: DadosNovoProduto): Promise<void> { throw indisponivel(); }
export async function atualizarProduto(_c: ContextoProdutos, _id: string, _d: DadosEdicaoProduto): Promise<void> { throw indisponivel(); }
export async function inativarProduto(_c: ContextoProdutos, _id: string): Promise<void> { throw indisponivel(); }
export async function reativarProduto(_c: ContextoProdutos, _id: string): Promise<void> { throw indisponivel(); }
