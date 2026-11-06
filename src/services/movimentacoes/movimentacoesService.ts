import { collection, doc, query, where, onSnapshot, runTransaction, serverTimestamp, deleteField } from '@react-native-firebase/firestore';
import { obterAuth } from '../firebase/auth';
import { obterFirestore } from '../firebase/firestore';
import { COLLECTIONS } from '../firebase/collections';
import { converterProduto } from '../firebase/converters/produto';
import { converterMovimentacao } from '../firebase/converters/movimentacao';
import { normalizarMovimentacao, calcularNovoEstoque, lerRegistroMovimentacoes, acrescentarMovimentacao, ordenarMovimentacoes, calcularEstoqueEdicao, calcularEstoqueExclusao, retirarMovimentacao } from '../../utils/movimentacoes';
import type { DadosMovimentacao, DadosEntrada } from '../../utils/movimentacoes';
import type { ContextoProdutos } from '../../utils/produtos';
import type { Movimentacao, TipoMovimentacao } from '../../types/movimentacao.types';
import { validarProdutoAtivo } from '../../utils/cicloProduto';

function validarContexto(c: ContextoProdutos) {
  if (obterAuth().currentUser?.uid !== c.uid || !c.estabelecimentoId) throw new Error('Sessão inválida.');
}
export function observarMovimentacoesProduto(c: ContextoProdutos, produtoId: string, setorId: string,
  receber: (movs: Movimentacao[]) => void, erro: (erro: unknown) => void): () => void {
  validarContexto(c);
  return onSnapshot(query(collection(obterFirestore(), COLLECTIONS.movimentacoes),
    where('estabelecimentoId', '==', c.estabelecimentoId), where('produtoId', '==', produtoId)),
    { includeMetadataChanges: true }, snapshot => {
      try {
        validarContexto(c);
        receber(ordenarMovimentacoes(snapshot.docs.map(d => converterMovimentacao(d.data({ serverTimestamps: 'estimate' }),
          d.id, c.estabelecimentoId, produtoId, setorId, d.metadata.hasPendingWrites))));
      } catch (e) { erro(e); }
    }, erro);
}

async function registrar(c: ContextoProdutos, produtoId: string, setorId: string, tipo: TipoMovimentacao, dados: DadosMovimentacao): Promise<void> {
  validarContexto(c);
  const normalizado = normalizarMovimentacao(dados, tipo);
  const db = obterFirestore();
  // ID estável nas reavaliações da mesma transaction; nenhuma fila manual/offline.
  const movimentoRef = doc(collection(db, COLLECTIONS.movimentacoes));
  const produtoRef = doc(db, COLLECTIONS.produtos, produtoId);
  await runTransaction(db, async t => {
    validarContexto(c);
    const snapshot = await t.get(produtoRef);
    if (!snapshot.exists()) throw new Error('Produto não encontrado.');
    const dadosProduto = snapshot.data();
    if (!dadosProduto) throw new Error('Produto não encontrado.');
    const produto = converterProduto(dadosProduto, produtoId, c.estabelecimentoId, setorId);
    validarProdutoAtivo(produto);
    const quantidade = normalizado.quantidade;
    const estoqueAtual = calcularNovoEstoque(produto.estoqueAtual, tipo, quantidade);
    const registro = acrescentarMovimentacao(lerRegistroMovimentacoes(dadosProduto, produtoId), movimentoRef.id);
    validarContexto(c);
    t.set(movimentoRef, { id: movimentoRef.id, estabelecimentoId: c.estabelecimentoId, produtoId, setorId: produto.setorId,
      tipo, ...normalizado, criadoPor: c.uid, criadoEm: serverTimestamp() });
    t.update(produtoRef, { estoqueAtual, possuiHistorico: true, atualizadoEm: serverTimestamp(), ...registro });
  });
}
export function registrarEntrada(c: ContextoProdutos, produtoId: string, setorId: string, d: DadosEntrada): Promise<void> { return registrar(c, produtoId, setorId, 'entrada', d); }
export function registrarSaida(c: ContextoProdutos, produtoId: string, setorId: string, d: DadosMovimentacao): Promise<void> { return registrar(c, produtoId, setorId, 'saida', d); }

async function alterar(c: ContextoProdutos, produtoId: string, setorId: string, movimentoId: string, dados?: DadosMovimentacao): Promise<void> {
  validarContexto(c);
  const db = obterFirestore(), movimentoRef = doc(db, COLLECTIONS.movimentacoes, movimentoId), produtoRef = doc(db, COLLECTIONS.produtos, produtoId);
  await runTransaction(db, async t => {
    validarContexto(c);
    const movimentoSnapshot = await t.get(movimentoRef);
    if (!movimentoSnapshot.exists()) throw new Error('Movimentação não encontrada. Atualize o histórico.');
    const movimento = converterMovimentacao(movimentoSnapshot.data(), movimentoId, c.estabelecimentoId, produtoId, setorId);
    const normalizado = dados === undefined ? undefined : normalizarMovimentacao(dados, movimento.tipo);
    const produtoSnapshot = await t.get(produtoRef);
    const dadosProduto = produtoSnapshot.data();
    if (!produtoSnapshot.exists() || !dadosProduto) throw new Error('Produto não encontrado.');
    const produto = converterProduto(dadosProduto, produtoId, c.estabelecimentoId, movimento.setorId);
    validarProdutoAtivo(produto);
    validarContexto(c);
    if (normalizado) {
      const estoqueAtual = calcularEstoqueEdicao(produto.estoqueAtual, movimento.tipo, movimento.quantidade, normalizado.quantidade);
      t.update(movimentoRef, { quantidade: normalizado.quantidade, observacao: normalizado.observacao ?? deleteField(),
        vendedorNome: normalizado.vendedorNome ?? deleteField(), atualizadoEm: serverTimestamp() });
      if (normalizado.quantidade !== movimento.quantidade) t.update(produtoRef, { estoqueAtual, ultimaMovimentacaoId: movimentoId, atualizadoEm: serverTimestamp() });
    } else {
      const estoqueAtual = calcularEstoqueExclusao(produto.estoqueAtual, movimento.tipo, movimento.quantidade);
      const registro = retirarMovimentacao(lerRegistroMovimentacoes(dadosProduto, produtoId), movimentoId);
      t.delete(movimentoRef);
      t.update(produtoRef, { estoqueAtual, ...registro, atualizadoEm: serverTimestamp() });
    }
  });
}
export function editarMovimentacao(c: ContextoProdutos, p: string, s: string, id: string, d: DadosMovimentacao): Promise<void> { return alterar(c, p, s, id, d); }
export function excluirMovimentacao(c: ContextoProdutos, p: string, s: string, id: string): Promise<void> { return alterar(c, p, s, id); }
