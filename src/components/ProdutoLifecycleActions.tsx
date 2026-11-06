import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { Produto } from '../types/produto.types';
import type { ContextoProdutos } from '../utils/produtos';
import { mensagemErroProdutos } from '../utils/produtos';
import { mensagemInativacao } from '../utils/cicloProduto';
import { inativarProduto, reativarProduto } from '../services/produtos/produtosService';
import { spacing } from '../theme';
import { AppButton } from './ui/AppButton';
import { useFeedback } from './ui/FeedbackProvider';
import ConfirmModal from './ConfirmModal';

type Acao = 'inativar' | 'reativar';
export function ProdutoLifecycleActions({ produto, contexto }: {
  produto: Produto; contexto: ContextoProdutos | null;
}) {
  const [acao, setAcao] = useState<Acao | null>(null), [busy, setBusy] = useState(false);
  const lock = useRef(false), mounted = useRef(true);
  const feedback = useFeedback();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  function selecionar(proxima: Acao) {
    if (lock.current) return;
    setAcao(proxima);
  }
  async function confirmar() {
    if (lock.current || !contexto || !acao) return;
    lock.current = true; setBusy(true);
    try {
      await (acao === 'inativar' ? inativarProduto : reativarProduto)(contexto, produto.id);
      // O listener pode remover o cartão antes de a Promise resolver; feedback é global.
      feedback(acao === 'inativar' ? 'Produto inativado. Histórico preservado.' : 'Produto reativado com sucesso.', 'success');
    } catch (e) { if (mounted.current) feedback(mensagemErroProdutos(e), 'error'); }
    finally { lock.current = false; if (mounted.current) { setAcao(null); setBusy(false); } }
  }
  return <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
    <AppButton variant="secondary" label={produto.status === 'inativo' ? 'Reativar produto' : 'Inativar produto'}
      disabled={!contexto || busy} onPress={() => selecionar(produto.status === 'inativo' ? 'reativar' : 'inativar')} />
    <ConfirmModal visible={acao !== null} busy={busy} destructive={false}
      title={acao === 'inativar' ? 'Inativar produto' : 'Reativar produto'}
      message={acao === 'inativar' ? mensagemInativacao(produto)
        : 'O produto voltará às listas normais e poderá receber movimentações. O estoque e o histórico serão preservados.'}
      confirmText={busy ? 'Aguarde...' : acao === 'inativar' ? 'Inativar' : 'Reativar'}
      onConfirm={() => { void confirmar(); }} onCancel={() => { if (!lock.current) setAcao(null); }} />
  </View>;
}
