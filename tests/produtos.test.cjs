const test=require('node:test');
const assert=require('node:assert/strict');
const {ambiente,contexto}=require('./helpers/produtos-ambiente.cjs');
test('erro offline Android encapsulado é traduzido sem ocultar outros erros desconhecidos', () => {
  const a=ambiente(); const {mensagemErroMovimentacao}=a.carregar('src/utils/movimentacoes.ts');
  assert.equal(mensagemErroMovimentacao(Object.assign(new Error('[firestore/unknown] UNAVAILABLE: Unable to resolve host firestore.googleapis.com'),{code:'firestore/unknown'})), 'É necessária conexão para registrar esta movimentação.');
  assert.equal(mensagemErroMovimentacao(Object.assign(new Error('Outro erro'),{code:'firestore/unknown'})), 'Não foi possível registrar a movimentação. Tente novamente.');
});
test('inicial positiva grava um único batch com produto, movimento e contador', async () => {
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:' Produto ',quantidadeInicial:10});
  assert.equal(a.commits.length,1); assert.equal(a.commits[0].length,3);
  const p=a.docs.get('produtos/p1'), m=a.docs.get('movimentacoes/inicial_p1');
  assert.equal(p.estoqueAtual,10); assert.equal(m.quantidade,10); assert.equal(m.criadoEm,p.criadoEm);
  assert.equal(m.criadoPor,'a'); assert.equal(m.observacao,'Estoque inicial');
  assert.equal(a.docs.get('setores/s1').quantidadeProdutos,1);
});
test('11A inicial zero preserva produto e contador sem API de exclusão',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Zero',quantidadeInicial:0});
  assert.equal(a.docs.has('movimentacoes/inicial_p1'),false); assert.equal(a.docs.get('produtos/p1').estoqueAtual,0);
  assert.equal(a.produtos.removerProduto,undefined); assert.equal(a.docs.has('produtos/p1'),true);
  assert.equal(a.docs.get('setores/s1').quantidadeProdutos,1);
});
test('editar metadados preserva vínculos, inicial, projeção e histórico',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',descricao:'Texto',quantidadeInicial:10,estoqueMinimo:1});
  const original={...a.docs.get('produtos/p1')}, movimento={...a.docs.get('movimentacoes/inicial_p1')};
  await a.produtos.atualizarProduto(contexto,'p1',{nome:'Novo',estoqueMinimo:10});
  delete original.descricao;
  assert.deepEqual(a.docs.get('produtos/p1'),{...original,nome:'Novo',estoqueMinimo:10,atualizadoEm:a.agora});
  assert.deepEqual(a.docs.get('movimentacoes/inicial_p1'),movimento);
});
test('RN08 consulta Produtos Firestore e bloqueia setor com produto',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  await assert.rejects(a.setores.removerSetor(contexto,'s1'),/possui produtos cadastrados/);
  assert.equal(a.consultas.at(-1).collection.name,'produtos');
  assert.deepEqual(a.consultas.at(-1).filters.slice(0,2).map(f=>[f.field,f.value]),[['estabelecimentoId','est_a'],['setorId','s1']]);
  assert.equal(a.docs.has('setores/s1'),true);
});
test('histórico inicial bloqueia exclusão e mantém RN08',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  assert.equal(a.produtos.removerProduto, undefined);
  assert.equal(a.docs.has('produtos/p1'),true); assert.equal(a.docs.has('movimentacoes/inicial_p1'),true);
  await assert.rejects(a.setores.removerSetor(contexto,'s1'),/possui produtos/);
});
test('histórico inesperado impede cascade parcial e preserva todos os documentos',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  a.docs.set('movimentacoes/externa',{estabelecimentoId:'est_a',produtoId:'p1'});
  const antes=[...a.docs]; assert.equal(a.produtos.removerProduto, undefined);
  assert.deepEqual([...a.docs],antes);
});
test('listener lista apenas estabelecimento e setor atuais; troca de conta invalida contexto',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:0});
  a.docs.set('produtos/p_b',{...a.docs.get('produtos/p1'),id:'p_b',estabelecimentoId:'est_b'});
  let recebidos; a.produtos.observarProdutos(contexto,'s1',p=>recebidos=p,e=>{throw e;});
  assert.deepEqual(recebidos.map(p=>p.id),['p1']);
  a.auth.currentUser={uid:'b'}; await assert.rejects(a.produtos.criarProduto(contexto,'s1',{nome:'Outro',quantidadeInicial:0}),/Sessão inválida/);
});
test('normalização e formulário rejeitam frações, expoentes, negativos e inteiros inexatos',()=>{
  const a=ambiente(), u=a.carregar('src/utils/produtos.ts');
  for(const valor of [-1,0.5,Infinity,NaN,9007199254740992]) assert.throws(()=>u.normalizarNovoProduto({nome:'Nome',quantidadeInicial:valor}));
  for(const texto of ['','-1','1.5','1e3','Infinity','9007199254740992']) assert.throws(()=>u.lerQuantidadeFormulario(texto,'Quantidade'));
  assert.throws(()=>u.normalizarEdicaoProduto({nome:' '}));
  assert.throws(()=>u.normalizarEdicaoProduto({nome:'Nome',estoqueMinimo:-1}));
  assert.equal(u.lerQuantidadeFormulario(' 10 ','Quantidade'),10);
});
test('reposição usa <= mínimo incluindo zero; mínimo ausente não gera reposição',()=>{
  const u=ambiente().carregar('src/utils/produtos.ts');
  for(const saldo of [0,9,10]) assert.equal(u.precisaReposicao({estoqueAtual:saldo,estoqueMinimo:10}),true);
  assert.equal(u.precisaReposicao({estoqueAtual:11,estoqueMinimo:10}),false);
  assert.equal(u.precisaReposicao({estoqueAtual:0}),false);
});
test('converter aceita projeção movimentada e rejeita saldo inválido, campos extras e vínculo cruzado',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  const c=a.carregar('src/services/firebase/converters/produto.ts').converterProduto, base=a.docs.get('produtos/p1');
  for(const extra of [{estoqueAtual:-1},{estoqueAtual:0.5},{estabelecimentoId:'est_b'},{setorId:'s2'},{saldo:10},{criadoEm:'hoje'}]) {
    assert.throws(()=>c({...base,...extra},'p1','est_a','s1'));
  }
  assert.equal(c(base,'p1','est_a','s1').criadoEm instanceof Date,true);
  assert.equal(c({...base,estoqueAtual:15},'p1','est_a','s1').estoqueAtual,15);
});

test('entrada e saída criam histórico real e preservam campos imutáveis do produto',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  const original={...a.docs.get('produtos/p1')};
  await a.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade:5,observacao:' Compra '});
  assert.equal(a.docs.get('produtos/p1').estoqueAtual,15);
  await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:4});
  const p=a.docs.get('produtos/p1'); assert.equal(p.estoqueAtual,11);
  for(const campo of ['id','estabelecimentoId','setorId','quantidadeInicial','criadoEm','nome']) assert.deepEqual(p[campo],original[campo]);
  const movs=[...a.docs].filter(([k])=>k.startsWith('movimentacoes/')).map(([,d])=>d);
  assert.equal(movs.reduce((s,m)=>s+(m.tipo==='entrada'?m.quantidade:-m.quantidade),0),11);
  assert.equal(movs.find(m=>m.id==='p2').observacao,'Compra');
  assert.equal(p.quantidadeMovimentacoes,3);
});
test('saída acima do saldo não grava nada; saída exata zera e rejeita saída posterior',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:11});
  const antes=[...a.docs]; await assert.rejects(a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:12}),/Estoque insuficiente/);
  assert.deepEqual([...a.docs],antes);
  await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:11}); assert.equal(a.docs.get('produtos/p1').estoqueAtual,0);
  await assert.rejects(a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:1}),/Estoque insuficiente/);
});
test('transaction reavaliada lê saldo novo e rejeita saída que deixou de caber',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  a.falhas.reavaliar=()=>{ const p=a.docs.get('produtos/p1'); a.docs.set('produtos/p1',{...p,estoqueAtual:2}); };
  await assert.rejects(a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:7}),/Estoque insuficiente/);
  assert.equal(a.docs.get('produtos/p1').estoqueAtual,2);
  assert.equal([...a.docs.keys()].filter(k=>k.startsWith('movimentacoes/')).length,1);
});
test('offline não confirma entrada/saída nem cria fila ou escrita parcial',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  const antes=[...a.docs]; a.falhas.offline=true;
  for(const registrar of [a.movimentos.registrarEntrada,a.movimentos.registrarSaida]) await assert.rejects(registrar(contexto,'p1','s1',{quantidade:1}));
  assert.deepEqual([...a.docs],antes);
});
test('histórico consulta estabelecimento+produto, converte inicial legado e não expõe outros produtos',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  delete a.docs.get('movimentacoes/inicial_p1').id;
  a.docs.set('movimentacoes/alheia',{produtoId:'outro',estabelecimentoId:'est_a'});
  let lista; a.movimentos.observarMovimentacoesProduto(contexto,'p1','s1',m=>lista=m,e=>{throw e;});
  assert.equal(lista.length,1); assert.equal(lista[0].id,'inicial_p1'); assert.equal(lista[0].criadoEm instanceof Date,true);
  assert.deepEqual(a.consultas.at(-1).filters.map(f=>f.field),['estabelecimentoId','produtoId']);
});
test('preserva histórico de seis movimentos e acima do registro técnico',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  const max=a.carregar('src/utils/movimentacoes.ts').LIMITE_REGISTRO_MOVIMENTACOES;
  for(let i=1;i<max;i++) await a.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade:1});
  assert.equal(a.produtos.removerProduto, undefined); assert.equal([...a.docs.keys()].filter(k=>k.startsWith('movimentacoes/')).length,max);
  const b=ambiente(); await b.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  for(let i=1;i<=max;i++) await b.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade:1});
  const antes=[...b.docs]; assert.equal(b.produtos.removerProduto, undefined);
  assert.deepEqual([...b.docs],antes);
});
test('movimentos exigem quantidade positiva segura e rejeitam vínculos incorretos',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
  for(const quantidade of [0,-1,1.5,NaN,Infinity,9007199254740992]) await assert.rejects(a.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade}));
  await assert.rejects(a.movimentos.registrarEntrada(contexto,'p1','setor_alheio',{quantidade:1}),/Produto inválido/);
  a.auth.currentUser={uid:'b'}; await assert.rejects(a.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade:1}),/Sessão inválida/);
});
test('registro legado deriva inicial e histórico ordena por data decrescente sem mutação',()=>{
  const a=ambiente(), u=a.carregar('src/utils/movimentacoes.ts');
  assert.deepEqual(u.lerRegistroMovimentacoes({quantidadeInicial:10},'p1'),{quantidadeMovimentacoes:1,movimentacaoIds:['inicial_p1'],ultimaMovimentacaoId:'inicial_p1'});
  assert.equal(u.lerRegistroMovimentacoes({quantidadeInicial:0},'p1').quantidadeMovimentacoes,0);
  const movs=[{id:'a',criadoEm:new Date(1)},{id:'b',criadoEm:new Date(3)},{id:'c',criadoEm:new Date(2)}];
  assert.deepEqual(u.ordenarMovimentacoes(movs).map(m=>m.id),['b','c','a']); assert.deepEqual(movs.map(m=>m.id),['a','b','c']);
  assert.throws(()=>u.calcularNovoEstoque(Number.MAX_SAFE_INTEGER,'entrada',1),/limite/);
});

test('7B fluxo completo: deltas, histórico real, inicial original e reposição',async()=>{
  const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10,estoqueMinimo:12});
  const check=()=>{const p=a.docs.get('produtos/p1'); const movs=[...a.docs].filter(([k])=>k.startsWith('movimentacoes/')).map(([,m])=>m);
    assert.equal(p.estoqueAtual,movs.reduce((s,m)=>s+(m.tipo==='entrada'?m.quantidade:-m.quantidade),0)); assert.equal(p.quantidadeMovimentacoes,movs.length);};
  check(); await a.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade:5}); check();
  await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:4}); check();
  await a.movimentos.editarMovimentacao(contexto,'p1','s1','p2',{quantidade:8}); check(); assert.equal(a.docs.get('produtos/p1').estoqueAtual,14);
  await a.movimentos.editarMovimentacao(contexto,'p1','s1','p3',{quantidade:6}); check(); assert.equal(a.docs.get('produtos/p1').estoqueAtual,12);
  assert.equal(a.carregar('src/utils/produtos.ts').precisaReposicao(a.docs.get('produtos/p1')),true);
  const before=[...a.docs]; await assert.rejects(a.movimentos.editarMovimentacao(contexto,'p1','s1','p3',{quantidade:20}),/negativo/); assert.deepEqual([...a.docs],before);
  await a.movimentos.excluirMovimentacao(contexto,'p1','s1','p3');check();assert.equal(a.docs.get('produtos/p1').estoqueAtual,18);
  await a.movimentos.excluirMovimentacao(contexto,'p1','s1','p2');check();assert.equal(a.docs.get('produtos/p1').estoqueAtual,10);
  await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:1});check();
  await assert.rejects(a.movimentos.excluirMovimentacao(contexto,'p1','s1','inicial_p1'),/negativo/);check();
});
test('7B observação sem escrita no produto; exclusões e inicial seguem mesmas invariantes',async()=>{
 const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
 await a.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade:5}); await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:4});
 const original={...a.docs.get('produtos/p1')};
 await a.movimentos.editarMovimentacao(contexto,'p1','s1','p2',{quantidade:5,observacao:'Correção'});
 assert.equal(a.commits.at(-1).length,1); assert.deepEqual(a.docs.get('produtos/p1'),original);
 await a.movimentos.editarMovimentacao(contexto,'p1','s1','p2',{quantidade:5}); assert.equal(a.docs.get('movimentacoes/p2').observacao,undefined);
 await a.movimentos.excluirMovimentacao(contexto,'p1','s1','p3'); assert.equal(a.docs.get('produtos/p1').estoqueAtual,15);
 await a.movimentos.excluirMovimentacao(contexto,'p1','s1','p2'); assert.equal(a.docs.get('produtos/p1').estoqueAtual,10);
 await a.movimentos.editarMovimentacao(contexto,'p1','s1','inicial_p1',{quantidade:8}); assert.equal(a.docs.get('produtos/p1').quantidadeInicial,10);
 await a.movimentos.excluirMovimentacao(contexto,'p1','s1','inicial_p1'); assert.equal(a.docs.get('produtos/p1').estoqueAtual,0);
 assert.equal(a.produtos.removerProduto, undefined); assert.equal(a.docs.get('produtos/p1').possuiHistorico,true);
});
test('7B offline, inválidos e entrada que geraria negativo não têm efeito',async()=>{
 const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
 await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:4}); const before=[...a.docs];
 await assert.rejects(a.movimentos.excluirMovimentacao(contexto,'p1','s1','inicial_p1'),/negativo/);
 for(const quantidade of [0,-1,1.5,NaN,Infinity]) await assert.rejects(a.movimentos.editarMovimentacao(contexto,'p1','s1','p2',{quantidade}));
 a.falhas.offline=true;
 await assert.rejects(a.movimentos.editarMovimentacao(contexto,'p1','s1','p2',{quantidade:2}));
 await assert.rejects(a.movimentos.excluirMovimentacao(contexto,'p1','s1','p2'));
 assert.deepEqual([...a.docs],before);
 assert.equal(a.carregar('src/utils/movimentacoes.ts').mensagemErroMovimentacao(Object.assign(new Error('offline'),{code:'firestore/unavailable'}),true),'É necessária conexão para alterar movimentações.');
});
test('7B reavaliação relê movimento e saldo concorrentes',async()=>{
 const a=ambiente(); await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:12});
 await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:2});
 a.falhas.reavaliar=()=>{const p=a.docs.get('produtos/p1');a.docs.set('produtos/p1',{...p,estoqueAtual:5});};
 await assert.rejects(a.movimentos.editarMovimentacao(contexto,'p1','s1','p2',{quantidade:8}),/negativo/);
 assert.equal(a.docs.get('movimentacoes/p2').quantidade,2);
});
test('7B reavaliação usa quantidade antiga atualizada por outro cliente',async()=>{
 const a=ambiente();await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:12});await a.movimentos.registrarSaida(contexto,'p1','s1',{quantidade:2});
 a.falhas.reavaliar=()=>{const p=a.docs.get('produtos/p1'),m=a.docs.get('movimentacoes/p2');a.docs.set('produtos/p1',{...p,estoqueAtual:9});a.docs.set('movimentacoes/p2',{...m,quantidade:3});};
 await a.movimentos.editarMovimentacao(contexto,'p1','s1','p2',{quantidade:8});assert.equal(a.docs.get('produtos/p1').estoqueAtual,4);
});
test('7B excluir entrada relê saldo quando uma saída concorrente consome estoque',async()=>{
 const a=ambiente();await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
 a.falhas.reavaliar=()=>{const p=a.docs.get('produtos/p1');a.docs.set('produtos/p1',{...p,estoqueAtual:9});};
 await assert.rejects(a.movimentos.excluirMovimentacao(contexto,'p1','s1','inicial_p1'),/negativo/);assert.equal(a.docs.has('movimentacoes/inicial_p1'),true);
});

test('7B registro parcial e marcador impedem cascade após exclusões acima de seis',async()=>{
 const a=ambiente();await a.produtos.criarProduto(contexto,'s1',{nome:'Nome',quantidadeInicial:10});
 for(let i=0;i<9;i++)await a.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade:1});
 await a.movimentos.excluirMovimentacao(contexto,'p1','s1','inicial_p1');
 assert.equal(a.docs.get('produtos/p1').quantidadeMovimentacoes,9);assert.equal(a.docs.get('produtos/p1').movimentacaoIds.length,5);
 await a.movimentos.registrarEntrada(contexto,'p1','s1',{quantidade:1});
 for(const id of ['p7','p8','p9','p10'])await a.movimentos.excluirMovimentacao(contexto,'p1','s1',id);
 assert.equal(a.docs.get('produtos/p1').quantidadeMovimentacoes,6);assert.equal(a.docs.get('produtos/p1').movimentacaoIds.length,6);
 const antes=[...a.docs];assert.equal(a.produtos.removerProduto, undefined);assert.deepEqual([...a.docs],antes);
});
