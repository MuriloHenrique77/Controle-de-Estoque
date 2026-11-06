import type { ContextoProdutos } from '../../utils/produtos';
import type { DadosRelatorio, IntervaloRelatorio } from '../../types/relatorio.types';

export function observarRelatorio(_c: ContextoProdutos, _p: IntervaloRelatorio,
  _r: (dados: DadosRelatorio) => void, erro: (e: unknown) => void): () => void {
  erro(new Error('Relatórios estão disponíveis no aplicativo Android, que utiliza Firebase nativo.'));
  return () => {};
}
