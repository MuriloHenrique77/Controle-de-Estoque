import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../../session/SessionProvider';
import type { DadosVisaoEstoque } from '../../types/visaoEstoque.types';
import { observarVisaoEstoque } from './visaoEstoqueService';
import { mensagemErroVisaoEstoque } from '../../utils/visaoEstoque';
type Estado = { status: 'loading' } | { status: 'error'; mensagem: string } | { status: 'data'; dados: DadosVisaoEstoque };
export function useVisaoEstoque(maxMovimentos = 5) {
  const { estado: sessao } = useSession();
  const uid = sessao.status === 'authenticatedReady' ? sessao.conta.uid : '';
  const estabelecimentoId = sessao.status === 'authenticatedReady' ? sessao.perfil.estabelecimentoId : '';
  const chave = `${uid}:${estabelecimentoId}:${maxMovimentos}`;
  const [tentativa, setTentativa] = useState(0);
  const [lista, setLista] = useState<{ chave: string; estado: Estado }>({ chave, estado: { status: 'loading' } });
  useFocusEffect(useCallback(() => {
    let ativo = true;
    let off: (() => void) | undefined;
    setLista({ chave, estado: { status: 'loading' } });
    const falhar = (e: unknown) => { if (ativo) setLista({ chave, estado: { status: 'error', mensagem: mensagemErroVisaoEstoque(e) } }); };
    if (uid && estabelecimentoId) {
      try { off = observarVisaoEstoque({ uid, estabelecimentoId }, maxMovimentos,
        dados => { if (ativo) setLista({ chave, estado: { status: 'data', dados } }); }, falhar); }
      catch (e) { falhar(e); }
    }
    return () => { ativo = false; off?.(); };
  }, [uid, estabelecimentoId, maxMovimentos, chave, tentativa]));
  const estado: Estado = lista.chave === chave ? lista.estado : { status: 'loading' };
  return { estado, estabelecimentoId, tentarNovamente: () => setTentativa(t => t + 1) };
}
