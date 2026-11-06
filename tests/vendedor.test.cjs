const test=require('node:test'), assert=require('node:assert/strict');
const {ambiente,contexto}=require('./helpers/produtos-ambiente.cjs');
const normalizar=ambiente().carregar('src/utils/movimentacoes.ts').normalizarMovimentacao;
for(const nome of ['', '   ', '\t\n', '\u00a0', 'A'.repeat(81), null, 42, [], {}])
 test('11A vendedor inválido '+JSON.stringify(nome),()=>assert.throws(()=>normalizar({quantidade:1,vendedorNome:nome},'saida')));
for(const nome of ['Carlos Henrique','carlos Henrique','A'.repeat(80)])
 test('11A trim e capitalização preservados '+nome.length,()=>assert.equal(normalizar({quantidade:1,vendedorNome:'  '+nome+'  '},'saida').vendedorNome,nome));
test('11A ausência real e entrada não aceita vendedor',async()=>{
 assert.equal('vendedorNome' in normalizar({quantidade:1},'saida'),false);
 assert.throws(()=>normalizar({quantidade:1,vendedorNome:'Carlos'},'entrada'));
 const a=ambiente();await a.produtos.criarProduto(contexto,'s1',{nome:'P',quantidadeInicial:20});
 await assert.rejects(a.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade:1,vendedorNome:'Carlos'}));
 await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:4});assert.equal('vendedorNome' in a.docs.get('movimentacoes/p2'),false);
 const converter=a.carregar('src/services/firebase/converters/movimentacao.ts').converterMovimentacao;
 assert.equal('vendedorNome' in converter(a.docs.get('movimentacoes/p2'),'p2','est_a','p1','s1'),false);
});
test('11A criar/adicionar/editar/remover vendedor mantém estoque; quantidade aplica só delta',async()=>{
 const a=ambiente();await a.produtos.criarProduto(contexto,'s1',{nome:'P',quantidadeInicial:20});
 await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:4,vendedorNome:' Carlos Henrique '});
 assert.equal(a.docs.get('movimentacoes/p2').vendedorNome,'Carlos Henrique');assert.equal(a.docs.get('produtos/p1').estoqueAtual,16);
 for(const nome of [undefined,'Joana','Maria',undefined]){
  await a.movimentos.editarMovimentacao(contexto,'p1','s1','p2',{quantidade:4,...(nome?{vendedorNome:nome}:{})});
  assert.equal(a.docs.get('produtos/p1').estoqueAtual,16);assert.equal(a.commits.at(-1).length,1);
  assert.equal(a.docs.get('movimentacoes/p2').vendedorNome,nome);assert.equal('vendedorNome' in a.docs.get('movimentacoes/p2'),!!nome);
 }
 await a.movimentos.editarMovimentacao(contexto,'p1','s1','p2',{quantidade:6,vendedorNome:'Carlos'});
 assert.equal(a.docs.get('produtos/p1').estoqueAtual,14);assert.equal(a.commits.at(-1).length,2);
 const converter=a.carregar('src/services/firebase/converters/movimentacao.ts').converterMovimentacao;
 assert.equal(converter(a.docs.get('movimentacoes/p2'),'p2','est_a','p1','s1').vendedorNome,'Carlos');
 await assert.rejects(a.movimentos.editarMovimentacao(contexto,'p1','s1','inicial_p1',{quantidade:20,vendedorNome:'Carlos'}));
});
test('11A vendedor preserva reavaliação concorrente, offline, saldo negativo e sessão',async()=>{
 const a=ambiente();await a.produtos.criarProduto(contexto,'s1',{nome:'P',quantidadeInicial:10});
 a.falhas.offline=true;await assert.rejects(a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:1,vendedorNome:'Carlos'}));assert.equal(a.docs.get('produtos/p1').estoqueAtual,10);
 a.falhas.offline=false;a.falhas.reavaliar=()=>{a.docs.get('produtos/p1').estoqueAtual=1;};
 await assert.rejects(a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:4,vendedorNome:'Carlos'}),/insuficiente/);
 assert.equal([...a.docs.keys()].filter(x=>x.startsWith('movimentacoes/')).length,1);
 a.auth.currentUser={uid:'b'};await assert.rejects(a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:1,vendedorNome:'Carlos'}),/Sessão/);
});
test('11A relatórios e rankings não dependem de vendedor',()=>{
 const a=ambiente(),agregar=a.carregar('src/utils/relatorios.ts').agregarRelatorio;
 const p={id:'p',estabelecimentoId:'est_a',setorId:'s',nome:'P',quantidadeInicial:0,estoqueAtual:4,status:'ativo',criadoEm:new Date('2026-10-01')};
 const m={id:'m',estabelecimentoId:'est_a',produtoId:'p',setorId:'s',tipo:'saida',quantidade:4,criadoEm:new Date('2026-10-03')};
 const dados={produtos:[p],setores:[],movimentos:[m],emCache:false},f={inicio:new Date('2026-10-01'),fimExclusivo:new Date('2026-11-01')};
 const antes=agregar('est_a',dados,f),depois=agregar('est_a',{...dados,movimentos:[{...m,vendedorNome:'Carlos'}]},f);
 assert.deepEqual(depois.resumo,antes.resumo);assert.deepEqual(depois.maioresSaidas,antes.maioresSaidas);assert.deepEqual(depois.reposicao,antes.reposicao);
});
