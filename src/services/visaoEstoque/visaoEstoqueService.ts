import { collection, query, where, orderBy, limit, onSnapshot, type QuerySnapshot } from '@react-native-firebase/firestore';
import { obterAuth } from '../firebase/auth';
import { obterFirestore } from '../firebase/firestore';
import { COLLECTIONS } from '../firebase/collections';
import { converterProduto } from '../firebase/converters/produto';
import { converterSetor } from '../firebase/converters/setor';
import { converterMovimentacao } from '../firebase/converters/movimentacao';
import type { ContextoProdutos } from '../../utils/produtos';
import type { DadosVisaoEstoque } from '../../types/visaoEstoque.types';

/** Limite zero: somente produtos e setores; positivo: acrescenta histórico global paginado. */
export function observarVisaoEstoque(c: ContextoProdutos, maxMovimentos: number,
  receber: (dados: DadosVisaoEstoque) => void, erro: (e: unknown) => void): () => void {
  if (!Number.isSafeInteger(maxMovimentos) || maxMovimentos < 0) throw new Error('Limite inválido.');
  function validarSessao() {
    if (!c.estabelecimentoId || obterAuth().currentUser?.uid !== c.uid) throw new Error('Sessão inválida.');
  }
  validarSessao();
  const db = obterFirestore(), dados: Partial<DadosVisaoEstoque> = maxMovimentos === 0 ? { movimentos: [] } : {};
  const cache = { produtos: true, setores: true, movimentos: maxMovimentos > 0 };
  const listeners: Array<() => void> = [];
  let ativo = true;
  function parar() { ativo = false; for (const off of listeners.splice(0)) off(); }
  function falhar(e: unknown) { if (ativo) { parar(); erro(e); } }
  function publicar() {
    validarSessao();
    if (ativo && dados.produtos && dados.setores && dados.movimentos) receber({
      produtos: dados.produtos, setores: dados.setores, movimentos: dados.movimentos,
      emCache: cache.produtos || cache.setores || cache.movimentos,
    });
  }
  function registrar(colecao: string, convert: (s: QuerySnapshot) => void, recentes = false) {
    if (!ativo) return;
    const filtro = where('estabelecimentoId', '==', c.estabelecimentoId);
    const consulta = recentes ? query(collection(db, colecao), filtro, orderBy('criadoEm', 'desc'), limit(maxMovimentos))
      : query(collection(db, colecao), filtro);
    const off = onSnapshot(consulta, { includeMetadataChanges: true }, snapshot => {
      if (!ativo) return;
      try { validarSessao(); convert(snapshot); publicar(); } catch (e) { falhar(e); }
    }, falhar);
    if (ativo) listeners.push(off); else off();
  }
  try {
    registrar(COLLECTIONS.produtos, s => {
      dados.produtos = s.docs.map(d => {
        const data: Record<string, unknown> = d.data({ serverTimestamps: 'estimate' });
        if (typeof data.setorId !== 'string') throw new Error('Vínculo inválido.');
        return converterProduto(data, d.id, c.estabelecimentoId, data.setorId, d.metadata.hasPendingWrites);
      }); cache.produtos = s.metadata.fromCache || s.metadata.hasPendingWrites;
    });
    registrar(COLLECTIONS.setores, s => {
      dados.setores = s.docs.map(d => converterSetor(d.data({ serverTimestamps: 'estimate' }), d.id, c.estabelecimentoId, d.metadata.hasPendingWrites));
      cache.setores = s.metadata.fromCache || s.metadata.hasPendingWrites;
    });
    if (maxMovimentos > 0) registrar(COLLECTIONS.movimentacoes, s => {
      dados.movimentos = s.docs.map(d => {
        const data: Record<string, unknown> = d.data({ serverTimestamps: 'estimate' });
        if (typeof data.produtoId !== 'string' || typeof data.setorId !== 'string') throw new Error('Vínculo inválido.');
        return converterMovimentacao(data, d.id, c.estabelecimentoId, data.produtoId, data.setorId, d.metadata.hasPendingWrites);
      }); cache.movimentos = s.metadata.fromCache || s.metadata.hasPendingWrites;
    }, true);
  } catch (e) { falhar(e); }
  return parar;
}
