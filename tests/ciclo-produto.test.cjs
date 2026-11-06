const test = require('node:test');
const assert = require('node:assert/strict');
const { ambiente, contexto } = require('./helpers/produtos-ambiente.cjs');

for (const quantidadeInicial of [0, 10]) test(`10B criação ${quantidadeInicial} mantém ciclo e movimento no mesmo batch`, async () => {
  const a = ambiente(); await a.produtos.criarProduto(contexto, 's1', { nome: 'Produto', quantidadeInicial });
  const p = a.docs.get('produtos/p1');
  assert.equal(p.status, 'ativo'); assert.equal(p.inativadoEm, null); assert.equal(p.inativadoPor, null);
  assert.equal(p.possuiHistorico, quantidadeInicial > 0); assert.equal(a.commits.length, 1);
  assert.equal(a.docs.has('movimentacoes/inicial_p1'), quantidadeInicial > 0);
});
test('10B primeira entrada marca histórico atomicamente; excluir último movimento nunca libera produto', async () => {
  const a = ambiente(); await a.produtos.criarProduto(contexto, 's1', { nome: 'Produto', quantidadeInicial: 0 });
  await a.movimentos.registrarEntrada(contexto, 'p1', 's1', { quantidade: 3 });
  assert.equal(a.commits.at(-1).length, 2); assert.equal(a.docs.get('produtos/p1').possuiHistorico, true);
  await a.movimentos.excluirMovimentacao(contexto, 'p1', 's1', 'p2');
  assert.equal(a.docs.get('produtos/p1').estoqueAtual, 0);
  assert.equal(a.docs.get('produtos/p1').quantidadeMovimentacoes, 0);
  assert.equal(a.docs.get('produtos/p1').possuiHistorico, true);
  assert.equal(a.produtos.removerProduto, undefined);
});
test('10B inativação positiva preserva campos/histórico/RN08; bloqueia três mutações; reativação restaura uso', async () => {
  const a = ambiente(); await a.produtos.criarProduto(contexto, 's1', { nome: 'Produto', quantidadeInicial: 10, estoqueMinimo: 12 });
  const antes = { ...a.docs.get('produtos/p1') }, movimentos = [...a.docs].filter(([p]) => p.startsWith('movimentacoes/'));
  await a.produtos.inativarProduto(contexto, 'p1');
  assert.deepEqual(a.docs.get('produtos/p1'), { ...antes, status: 'inativo', inativadoEm: a.agora, inativadoPor: contexto.uid });
  assert.deepEqual([...a.docs].filter(([p]) => p.startsWith('movimentacoes/')), movimentos);
  const contagem = a.commits.length;
  for (const op of [() => a.movimentos.registrarEntrada(contexto, 'p1', 's1', { quantidade: 1 }),
    () => a.movimentos.registrarSaida(contexto, 'p1', 's1', { quantidade: 1 }),
    () => a.movimentos.editarMovimentacao(contexto, 'p1', 's1', 'inicial_p1', { quantidade: 5 }),
    () => a.movimentos.excluirMovimentacao(contexto, 'p1', 's1', 'inicial_p1')]) await assert.rejects(op(), /Produto inativo/);
  assert.equal(a.commits.length, contagem); await assert.rejects(a.setores.removerSetor(contexto, 's1'), /possui produtos/);
  await a.produtos.reativarProduto(contexto, 'p1'); assert.deepEqual(a.docs.get('produtos/p1'), antes);
  await a.movimentos.registrarEntrada(contexto, 'p1', 's1', { quantidade: 2 });
  await a.produtos.inativarProduto(contexto, 'p1'); assert.equal(a.docs.get('produtos/p1').estoqueAtual, 12);
});
test('10B legado permanece utilizável sem status/marcador, inativável, reativável e protegido contra exclusão', async () => {
  const a = ambiente(); await a.produtos.criarProduto(contexto, 's1', { nome: 'Legado', quantidadeInicial: 0 });
  const raw = a.docs.get('produtos/p1'); for (const c of ['status', 'possuiHistorico', 'inativadoEm', 'inativadoPor']) delete raw[c];
  const converter = a.carregar('src/services/firebase/converters/produto.ts').converterProduto;
  const p = converter(raw, 'p1', 'est_a', 's1'); assert.equal(p.status, 'ativo'); assert.equal(p.possuiHistorico, undefined);
  assert.equal(a.produtos.removerProduto, undefined);
  await a.produtos.inativarProduto(contexto, 'p1'); await a.produtos.reativarProduto(contexto, 'p1');
  assert.equal(a.produtos.removerProduto, undefined);
  await a.movimentos.registrarEntrada(contexto, 'p1', 's1', { quantidade: 1 }); assert.equal(raw.possuiHistorico, undefined);
  assert.equal(a.docs.get('produtos/p1').possuiHistorico, true);
});
test('11A inativo sem histórico não expõe exclusão e preserva RN08', async () => {
  const a = ambiente(); await a.produtos.criarProduto(contexto, 's1', { nome: 'Zero', quantidadeInicial: 0 });
  await a.produtos.inativarProduto(contexto, 'p1'); assert.equal(a.produtos.removerProduto, undefined);
  assert.equal(a.commits.at(-1).filter(w => w.type === 'delete').length, 0); assert.equal(a.docs.get('setores/s1').quantidadeProdutos, 1);
  await assert.rejects(a.setores.removerSetor(contexto, 's1'), /possui produtos/); assert.equal(a.docs.has('setores/s1'), true);
});
test('10B conversor recusa ciclo malformado e rotas não carregam data de inativação', async () => {
  const a = ambiente(); await a.produtos.criarProduto(contexto, 's1', { nome: 'Produto', quantidadeInicial: 0 });
  const converter = a.carregar('src/services/firebase/converters/produto.ts').converterProduto;
  const base = a.docs.get('produtos/p1');
  for (const extra of [{ status: ['ativo'] }, { status: null }, { status: 1 }, { possuiHistorico: 'false' },
    { inativadoEm: 'ontem' }, { inativadoPor: 1 }, { status: 'inativo', inativadoPor: null },
    { inativadoPor: 'a' }, { inativadoEm: a.agora }]) {
    assert.throws(() => converter({ ...base, ...extra }, 'p1', 'est_a', 's1'));
  }
  await a.produtos.inativarProduto(contexto, 'p1');
  const p = converter(a.docs.get('produtos/p1'), 'p1', 'est_a', 's1');
  const rota = a.carregar('src/navigation/dadosDeRota.ts').dadosDeRota(p);
  assert.equal('inativadoEm' in rota, false); assert.deepEqual(JSON.parse(JSON.stringify(rota)), rota);
});
test('10B operação offline, reavaliação concorrente e troca de sessão não confirmam ciclo inválido', async () => {
  const a = ambiente(); await a.produtos.criarProduto(contexto, 's1', { nome: 'Zero', quantidadeInicial: 0 });
  a.falhas.offline = true; await assert.rejects(a.produtos.inativarProduto(contexto, 'p1')); assert.equal(a.docs.get('produtos/p1').status, 'ativo');
  a.falhas.offline = false;
  a.falhas.reavaliar = () => a.docs.set('produtos/p1', { ...a.docs.get('produtos/p1'), status: 'inativo', inativadoEm: a.agora, inativadoPor: 'a' });
  await assert.rejects(a.produtos.inativarProduto(contexto, 'p1'), /já está inativo/);
  a.auth.currentUser = { uid: 'b' }; await assert.rejects(a.produtos.reativarProduto(contexto, 'p1'), /Sessão inválida/);
});
test('10B listas/Home/atenção consideram ativos e legado; relatório/global preservam todos históricos', async () => {
  const a = ambiente(); const ciclo = a.carregar('src/utils/cicloProduto.ts');
  const base = { id: 'p', estabelecimentoId: 'est_a', setorId: 's1', nome: 'Produto', quantidadeInicial: 0, estoqueAtual: 0, estoqueMinimo: 1, criadoEm: new Date('2026-10-01') };
  const produtos = [{ ...base, id: 'a', status: 'ativo' }, { ...base, id: 'i', status: 'inativo' }, { ...base, id: 'l' }];
  assert.deepEqual(produtos.filter(ciclo.produtoAtivo).map(p => p.id), ['a', 'l']);
  const movimentos = [{ id: 'm', estabelecimentoId: 'est_a', setorId: 's1', produtoId: 'i', tipo: 'entrada', quantidade: 10, criadoEm: new Date('2026-10-05') }];
  const dados = { produtos, setores: [], movimentos, emCache: false };
  const visao = a.carregar('src/utils/visaoEstoque.ts');
  assert.deepEqual(visao.resumirHome('est_a', dados), { totalProdutos: 2, totalSetores: 0, totalReposicao: 2, totalZerados: 2 });
  assert.equal(visao.listarMovimentosGlobais('est_a', dados)[0].produto.status, 'inativo');
  const r = a.carregar('src/utils/relatorios.ts').agregarRelatorio('est_a', dados, { inicio: new Date('2026-10-01'), fimExclusivo: new Date('2026-11-01') });
  assert.equal(r.resumo.totalEntradas, 10); assert.equal(r.maioresEntradas[0].produto.id, 'i');
  for (const campo of ['reposicao', 'zerados', 'semMovimentacao']) assert.deepEqual(r[campo].map(p => p.id), ['a', 'l']);
});

test('10D mensagem de inativação apresenta unidade no singular e unidades no plural', () => {
  const { mensagemInativacao } = ambiente().carregar('src/utils/cicloProduto.ts');
  assert.match(mensagemInativacao({ estoqueAtual: 1 }), /1 unidade em estoque/);
  assert.match(mensagemInativacao({ estoqueAtual: 2 }), /2 unidades em estoque/);
  assert.doesNotMatch(mensagemInativacao({ estoqueAtual: 0 }), /unidades? em estoque/);
});
