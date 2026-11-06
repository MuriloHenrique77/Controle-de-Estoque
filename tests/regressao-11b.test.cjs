const test = require('node:test'), assert = require('node:assert/strict');
const { ambiente, contexto } = require('./helpers/produtos-ambiente.cjs');

function saldoConsistente(a, expected) {
  const movements = [...a.docs].filter(([path]) => path.startsWith('movimentacoes/')).map(([, d]) => d);
  const sum = movements.reduce((v, m) => v + (m.tipo === 'entrada' ? m.quantidade : -m.quantidade), 0);
  assert.equal(sum, expected);
  assert.equal(a.docs.get('produtos/p1').estoqueAtual, sum);
}

for (const quantity of [5, 7]) test('11B releitura ao editar vendedor/quantidade após saída concorrente: ' + quantity, async () => {
  const a = ambiente();
  await a.produtos.criarProduto(contexto, 's1', { nome: 'P', quantidadeInicial: 20 });
  await a.movimentos.registrarSaida(contexto, 'p1', 's1', { quantidade: 5, vendedorNome: 'A' });
  const id = [...a.docs].find(([p,d]) => p.startsWith('movimentacoes/') && d.tipo === 'saida')[0].split('/')[1];
  a.falhas.reavaliar = () => {
    a.docs.get('produtos/p1').estoqueAtual = 12;
    a.docs.set('movimentacoes/concorrente', { id: 'concorrente', tipo: 'saida', quantidade: 3, produtoId: 'p1', setorId: 's1', estabelecimentoId: 'est_a', criadoPor: 'a', criadoEm: a.agora, vendedorNome: 'Outro' });
  };
  await a.movimentos.editarMovimentacao(contexto, 'p1', 's1', id, { quantidade: quantity, vendedorNome: 'C' });
  saldoConsistente(a, quantity === 5 ? 12 : 10);
  assert.equal(a.docs.get('movimentacoes/' + id).vendedorNome, 'C');
});

test('11B ledger completo, vendedor independente, remoções e ciclo preservam saldo e setor', async () => {
  const a = ambiente();
  await a.produtos.criarProduto(contexto, 's1', { nome: 'P', quantidadeInicial: 15, estoqueMinimo: 12 });
  saldoConsistente(a, 15);
  await a.movimentos.registrarEntrada(contexto, 'p1', 's1', { quantidade: 5 }); saldoConsistente(a, 20);
  await a.movimentos.registrarSaida(contexto, 'p1', 's1', { quantidade: 5, vendedorNome: 'A' }); saldoConsistente(a, 15);
  const movement = [...a.docs].find(([p,d]) => p.startsWith('movimentacoes/') && d.tipo === 'saida')[0].split('/')[1];
  await a.movimentos.editarMovimentacao(contexto, 'p1', 's1', movement, { quantidade: 5, vendedorNome: 'B' }); saldoConsistente(a, 15);
  await a.movimentos.editarMovimentacao(contexto, 'p1', 's1', movement, { quantidade: 7, vendedorNome: 'C' }); saldoConsistente(a, 13);
  await a.movimentos.editarMovimentacao(contexto, 'p1', 's1', movement, { quantidade: 7 }); saldoConsistente(a, 13);
  assert.equal('vendedorNome' in a.docs.get('movimentacoes/' + movement), false);
  await a.produtos.inativarProduto(contexto, 'p1'); saldoConsistente(a, 13);
  await assert.rejects(a.movimentos.registrarSaida(contexto, 'p1', 's1', { quantidade: 1, vendedorNome: 'D' }));
  await a.produtos.reativarProduto(contexto, 'p1'); saldoConsistente(a, 13);
  assert.equal(a.docs.get('produtos/p1').setorId, 's1');
  await a.movimentos.excluirMovimentacao(contexto, 'p1', 's1', movement); saldoConsistente(a, 20);
  const entry = [...a.docs].find(([p,d]) => p.startsWith('movimentacoes/') && d.quantidade === 5)[0].split('/')[1];
  await a.movimentos.excluirMovimentacao(contexto, 'p1', 's1', entry); saldoConsistente(a, 15);
});

for (const operation of ['saida', 'saidaVendedor', 'editarVendedor', 'editarQuantidade', 'inativar', 'reativar']) {
  test('11B offline rejeita ' + operation + ' sem mutação ou sucesso falso', async () => {
    const a = ambiente();
    await a.produtos.criarProduto(contexto, 's1', { nome: 'P', quantidadeInicial: 20 });
    await a.movimentos.registrarSaida(contexto, 'p1', 's1', { quantidade: 5, vendedorNome: 'A' });
    const id = [...a.docs].find(([p,d]) => p.startsWith('movimentacoes/') && d.tipo === 'saida')[0].split('/')[1];
    if (operation === 'reativar') await a.produtos.inativarProduto(contexto, 'p1');
    const before = JSON.stringify([...a.docs]);
    a.falhas.offline = true;
    const operations = {
      saida: () => a.movimentos.registrarSaida(contexto, 'p1', 's1', { quantidade: 1 }),
      saidaVendedor: () => a.movimentos.registrarSaida(contexto, 'p1', 's1', { quantidade: 1, vendedorNome: 'B' }),
      editarVendedor: () => a.movimentos.editarMovimentacao(contexto, 'p1', 's1', id, { quantidade: 5, vendedorNome: 'B' }),
      editarQuantidade: () => a.movimentos.editarMovimentacao(contexto, 'p1', 's1', id, { quantidade: 7, vendedorNome: 'C' }),
      inativar: () => a.produtos.inativarProduto(contexto, 'p1'),
      reativar: () => a.produtos.reativarProduto(contexto, 'p1'),
    };
    await assert.rejects(operations[operation]());
    assert.equal(JSON.stringify([...a.docs]), before);
  });
}

test('11B relatórios conhecidos invariantes à edição/remoção de vendedor e inativação histórica', () => {
  const a = ambiente(), aggregate = a.carregar('src/utils/relatorios.ts').agregarRelatorio;
  const product = (id, estoqueAtual, estoqueMinimo) => ({ id, nome: id, estabelecimentoId: 'est_a', setorId: 's1', status: 'ativo', estoqueAtual, estoqueMinimo });
  const movement = (id, tipo, quantidade, vendedorNome) => ({ id, tipo, quantidade, ...(vendedorNome ? { vendedorNome } : {}), estabelecimentoId: 'est_a', produtoId: 'P', setorId: 's1', criadoEm: new Date('2026-10-13') });
  const dados = { produtos: [product('P', 13, 15), product('Sem', 0, 0)], setores: [{ id: 's1', nome: 'S', estabelecimentoId: 'est_a' }], movimentos: [movement('e', 'entrada', 20), movement('s', 'saida', 7, 'A')], emCache: false };
  const filter = { inicio: new Date('2026-10-01'), fimExclusivo: new Date('2026-11-01') };
  const before = aggregate('est_a', dados, filter);
  assert.deepEqual(before.resumo, { totalEntradas: 20, totalSaidas: 7, saldoPeriodo: 13, quantidadeMovimentacoes: 2, produtosMovimentados: 1 });
  assert.equal(before.maioresEntradas[0].quantidade, 20); assert.equal(before.maioresSaidas[0].quantidade, 7);
  assert.equal(before.semMovimentacao[0].id, 'Sem'); assert.equal(before.reposicao.length, 2);
  for (const vendor of ['B', undefined]) {
    const changed = { ...dados, movimentos: [dados.movimentos[0], movement('s', 'saida', 7, vendor)] };
    const after = aggregate('est_a', changed, filter);
    for (const field of ['resumo', 'maioresEntradas', 'maioresSaidas', 'semMovimentacao', 'reposicao']) assert.deepEqual(after[field], before[field]);
  }
  const inactive = aggregate('est_a', { ...dados, produtos: dados.produtos.map(p => ({ ...p, status: 'inativo' })) }, filter);
  assert.deepEqual(inactive.resumo, before.resumo); assert.deepEqual(inactive.maioresSaidas, before.maioresSaidas.map(x => ({ ...x, produto: { ...x.produto, status: 'inativo' } })));
  assert.equal(inactive.reposicao.length, 0); assert.equal(inactive.semMovimentacao.length, 0);
});
