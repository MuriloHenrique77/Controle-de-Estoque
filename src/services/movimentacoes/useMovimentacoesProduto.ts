import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../../session/SessionProvider';
import { observarMovimentacoesProduto } from './movimentacoesService';
import { mensagemErroMovimentacao } from '../../utils/movimentacoes';
import type { Movimentacao } from '../../types/movimentacao.types';
type Estado = { status: 'loading' } | { status: 'data'; movimentos: Movimentacao[] } | { status: 'error'; mensagem: string };
export function useMovimentacoesProduto(produtoId: string, setorId: string) {
  const { estado: sessao } = useSession();
  const uid = sessao.status === 'authenticatedReady' ? sessao.conta.uid : '';
  const estabelecimentoId = sessao.status === 'authenticatedReady' ? sessao.perfil.estabelecimentoId : '';
  const chave = `${uid}:${estabelecimentoId}:${produtoId}:${setorId}`;
  const [lista, setLista] = useState<{ chave: string; estado: Estado }>({ chave, estado: { status: 'loading' } });
  const [tentativa, setTentativa] = useState(0);
  useFocusEffect(useCallback(() => {
    let ativo = true;
    let unsubscribe: (() => void) | undefined;
    setLista({ chave, estado: { status: 'loading' } });
    const erro = (e: unknown) => { if (ativo) setLista({ chave, estado: { status: 'error', mensagem: mensagemErroMovimentacao(e) } }); };
    if (uid && estabelecimentoId) {
      try { unsubscribe = observarMovimentacoesProduto({ uid, estabelecimentoId }, produtoId, setorId,
        movimentos => { if (ativo) setLista({ chave, estado: { status: 'data', movimentos } }); }, erro); }
      catch (e) { erro(e); }
    }
    return () => { ativo = false; unsubscribe?.(); };
  }, [uid, estabelecimentoId, produtoId, setorId, chave, tentativa]));
  return { estado: lista.chave === chave ? lista.estado : { status: 'loading' } as Estado,
    tentarNovamente: () => setTentativa(t => t + 1) };
}
