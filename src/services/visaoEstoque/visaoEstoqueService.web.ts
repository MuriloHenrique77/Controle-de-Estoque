import type { ContextoProdutos } from '../../utils/produtos';
import type { DadosVisaoEstoque } from '../../types/visaoEstoque.types';
export function observarVisaoEstoque(_c: ContextoProdutos, _limit: number, _next: (dados: DadosVisaoEstoque) => void,
  erro: (e: unknown) => void): () => void {
  erro({ code: 'app/web-unavailable' }); return () => {};
}
