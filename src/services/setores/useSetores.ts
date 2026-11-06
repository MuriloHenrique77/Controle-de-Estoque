import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../../session/SessionProvider';
import { observarSetores } from './setoresService';
import { mensagemErroSetores } from '../../utils/setores';
import type { Setor } from '../../types/setor.types';

type EstadoLista = { status: 'loading' } | { status: 'data'; setores: Setor[] } | { status: 'error'; mensagem: string };
export function useSetores() {
  const { estado: sessao } = useSession();
  const uid = sessao.status === 'authenticatedReady' ? sessao.conta.uid : '';
  const estabelecimentoId = sessao.status === 'authenticatedReady' ? sessao.perfil.estabelecimentoId : '';
  const chave = `${uid}:${estabelecimentoId}`;
  const [tentativa, setTentativa] = useState(0);
  const [lista, setLista] = useState<{ chave: string; estado: EstadoLista }>({ chave, estado: { status: 'loading' } });

  useFocusEffect(useCallback(() => {
    let ativo = true;
    let unsubscribe: (() => void) | undefined;
    setLista({ chave, estado: { status: 'loading' } });
    if (!uid || !estabelecimentoId) return () => { ativo = false; };
    const falhar = (e: unknown) => { if (ativo) setLista({ chave, estado: { status: 'error', mensagem: mensagemErroSetores(e) } }); };
    try {
      unsubscribe = observarSetores({ uid, estabelecimentoId }, setores => {
        if (ativo) setLista({ chave, estado: { status: 'data', setores } });
      }, falhar);
    } catch (e) { falhar(e); }
    return () => { ativo = false; unsubscribe?.(); };
  }, [uid, estabelecimentoId, chave, tentativa]));

  const estado: EstadoLista = lista.chave === chave ? lista.estado : { status: 'loading' };
  return { estado, contexto: uid && estabelecimentoId ? { uid, estabelecimentoId } : null,
    tentarNovamente: () => setTentativa(t => t + 1) };
}
