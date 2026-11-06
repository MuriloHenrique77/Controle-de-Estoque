import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../../session/SessionProvider';
import type { DadosRelatorio, IntervaloRelatorio } from '../../types/relatorio.types';
import { observarRelatorio } from './relatoriosService';
import { mensagemErroRelatorio } from '../../utils/relatorios';

type EstadoRelatorio = { status: 'loading' } | { status: 'error'; mensagem: string } | { status: 'data'; dados: DadosRelatorio };
export function useRelatorios(periodo: IntervaloRelatorio) {
  const { estado: sessao } = useSession();
  const uid = sessao.status === 'authenticatedReady' ? sessao.conta.uid : '';
  const estabelecimentoId = sessao.status === 'authenticatedReady' ? sessao.perfil.estabelecimentoId : '';
  const inicio = periodo.inicio.getTime(), fim = periodo.fimExclusivo.getTime();
  const chave = uid + ':' + estabelecimentoId + ':' + inicio + ':' + fim;
  const [tentativa, setTentativa] = useState(0);
  const [lista, setLista] = useState<{ chave: string; estado: EstadoRelatorio }>({ chave, estado: { status: 'loading' } });
  useFocusEffect(useCallback(() => {
    let ativo = true;
    let unsubscribe: (() => void) | undefined;
    setLista({ chave, estado: { status: 'loading' } });
    const erro = (e: unknown) => { if (ativo) setLista({ chave, estado: { status: 'error', mensagem: mensagemErroRelatorio(e) } }); };
    if (uid && estabelecimentoId) {
      try {
        unsubscribe = observarRelatorio({ uid, estabelecimentoId },
          { inicio: new Date(inicio), fimExclusivo: new Date(fim) },
          dados => { if (ativo) setLista({ chave, estado: { status: 'data', dados } }); }, erro);
      } catch (e) { erro(e); }
    }
    return () => { ativo = false; unsubscribe?.(); };
  }, [uid, estabelecimentoId, inicio, fim, chave, tentativa]));
  // Esta verificação ocorre no render, antes do cleanup: nenhum dado de A pisca em B.
  const estado: EstadoRelatorio = lista.chave === chave ? lista.estado : { status: 'loading' };
  return { estado, estabelecimentoId, tentarNovamente: () => setTentativa(t => t + 1) };
}
