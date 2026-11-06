const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function ambiente(sync=false){
 const listeners=[],auth={currentUser:{uid:'a'}},cache=new Map();
 class Timestamp{constructor(d){this.d=new Date(d);}toDate(){return new Date(this.d);}}
 const sdk={Timestamp,collection:(_,name)=>({name}),query:(collection,...filters)=>({collection,filters}),
  where:(field,operator,value)=>({field,operator,value}),orderBy:(field,direction)=>({field,direction}),limit:value=>({limit:value}),
  onSnapshot:(query,options,receive,error)=>{const l={query,options,receive,error,closed:0};listeners.push(l);if(sync)error(new Error('síncrono'));return()=>l.closed++;}};
 function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const m={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>{
   if(name==='@react-native-firebase/firestore')return sdk;
   if(name.endsWith('/firebase/auth'))return {obterAuth:()=>auth};
   if(name.endsWith('/firebase/firestore'))return {obterFirestore:()=>({})};
   return load(path.resolve(path.dirname(file),name+'.ts'));
  },m,m.exports);cache.set(file,m.exports);return m.exports;
 }return{load,listeners,auth};
}
const u=ambiente().load('src/utils/visaoEstoque.ts');
const produto=(id,saldo,minimo)=>({id,estabelecimentoId:'est',setorId:'s',nome:id,estoqueAtual:saldo,estoqueMinimo:minimo});
const dados={produtos:[produto('A',0),produto('B',2,2),produto('C',3,2),produto('D',0,0)],setores:[{id:'s',nome:'Setor',estabelecimentoId:'est'}],movimentos:[],emCache:false};
test('Home deriva totais da projeção atual sem somar inicial ou depender de movimentos recentes',()=>{
 const antes=JSON.stringify(dados);assert.deepEqual(u.resumirHome('est',dados),{totalProdutos:4,totalSetores:1,totalReposicao:2,totalZerados:2});assert.equal(JSON.stringify(dados),antes);
 assert.deepEqual(u.resumirHome('est',{produtos:[],setores:[],movimentos:[],emCache:false}),{totalProdutos:0,totalSetores:0,totalReposicao:0,totalZerados:0});
});
test('Home e movimentos globais recusam dados de outro estabelecimento',()=>{
 for(const campo of ['produtos','setores','movimentos'])for(const fn of [u.resumirHome,u.listarMovimentosGlobais])assert.throws(()=>fn('est',{...dados,[campo]:[{estabelecimentoId:'outro'}]}));
 assert.throws(()=>u.resumirHome('',dados));
});
test('movimentos globais ordenam datas/empates sem mutação e associam nomes sem leituras individuais',()=>{
 const m=(id,t)=>({id,produtoId:'A',setorId:'s',estabelecimentoId:'est',tipo:'entrada',quantidade:1,criadoEm:new Date(t)});
 const movimentos=[m('z',1),m('b',2),m('a',2)],r=u.listarMovimentosGlobais('est',{...dados,movimentos});
 assert.deepEqual(r.map(x=>x.movimento.id),['a','b','z']);assert.equal(r[0].produto.nome,'A');assert.equal(r[0].setor.nome,'Setor');assert.deepEqual(movimentos.map(x=>x.id),['z','b','a']);
 assert.equal(u.listarMovimentosGlobais('est',{...dados,produtos:[],movimentos})[0].produto,undefined);
});
const vazio=(cache=false)=>({docs:[],metadata:{fromCache:cache,hasPendingWrites:false}});
function iniciar(sync=false,limit=5){const e=ambiente(sync),recebidos=[],erros=[];const stop=e.load('src/services/visaoEstoque/visaoEstoqueService.ts').observarVisaoEstoque({uid:'a',estabelecimentoId:'est'},limit,d=>recebidos.push(d),e=>erros.push(e));return{...e,recebidos,erros,stop};}

test('11B vinte ciclos Home/global: cleanup único e callbacks tardios ignorados',()=>{
 for(let cycle=0;cycle<20;cycle++)for(const max of [0,50]){
  const e=iniciar(false,max);assert.equal(e.listeners.length,max===0?2:3);
  for(const l of e.listeners)l.receive(vazio());assert.equal(e.recebidos.length,1);
  e.stop();e.stop();for(const l of e.listeners){l.receive(vazio(true));l.error(new Error('tardio'));assert.equal(l.closed,1);}
  assert.equal(e.recebidos.length,1);assert.equal(e.erros.length,0);
 }
});
test('Histórico global usa três consultas isoladas, limite 5 e publicação somente após três snapshots; cleanup idempotente',()=>{
 const e=iniciar();assert.equal(e.listeners.length,3);for(const l of e.listeners)assert.deepEqual(l.query.filters[0],{field:'estabelecimentoId',operator:'==',value:'est'});
 assert.deepEqual(e.listeners[2].query.filters.slice(1),[{field:'criadoEm',direction:'desc'},{limit:5}]);
 e.listeners[0].receive(vazio());e.listeners[1].receive(vazio());assert.equal(e.recebidos.length,0);e.listeners[2].receive(vazio(true));assert.equal(e.recebidos[0].emCache,true);
 e.stop();e.stop();assert.ok(e.listeners.every(l=>l.closed===1));e.listeners[0].receive(vazio());assert.equal(e.recebidos.length,1);
 const global=iniciar(false,50);assert.equal(global.listeners[2].query.filters.at(-1).limit,50);global.stop();
});
test('erro, documento inconsistente, aquisição síncrona e troca de conta encerram listeners sem dados antigos',()=>{
 const a=iniciar();a.listeners[1].error(new Error('falha'));assert.equal(a.recebidos.length,0);assert.equal(a.erros.length,1);assert.ok(a.listeners.every(l=>l.closed===1));
 const b=iniciar();b.auth.currentUser={uid:'b'};b.listeners[0].receive(vazio());assert.equal(b.recebidos.length,0);assert.equal(b.erros.length,1);assert.ok(b.listeners.every(l=>l.closed===1));
 const c=iniciar();c.listeners[0].receive({docs:[{data:()=>({setorId:42}),metadata:{}}],metadata:{}});assert.equal(c.erros.length,1);assert.ok(c.listeners.every(l=>l.closed===1));
 const d=iniciar(true);assert.equal(d.listeners.length,1);assert.equal(d.listeners[0].closed,1);d.stop();
 const e=ambiente();assert.throws(()=>e.load('src/services/visaoEstoque/visaoEstoqueService.ts').observarVisaoEstoque({uid:'a',estabelecimentoId:'est'},-1,()=>{},()=>{}));assert.equal(e.listeners.length,0);
});
test('erros da visão de estoque não expõem mensagens ou códigos internos',()=>{
 assert.match(u.mensagemErroVisaoEstoque({code:'firestore/unavailable'}),/conexão/);assert.match(u.mensagemErroVisaoEstoque({code:'firestore/permission-denied'}),/sessão/);
 assert.match(u.mensagemErroVisaoEstoque({code:'app/web-unavailable'}),/Android/);assert.match(u.mensagemErroVisaoEstoque({code:'firestore/failed-precondition'}),/temporariamente/);
 assert.equal(u.mensagemErroVisaoEstoque(new Error('internal segredo')),'Não foi possível carregar o estoque. Tente novamente.');
});
test('hook faz cleanup em blur, limite, sessão e retry; esconde dados antigos antes dos efeitos',()=>{
 let cursor=0,session={status:'authenticatedReady',conta:{uid:'a'},perfil:{estabelecimentoId:'est'}},pending,cleanup,effect;
 const states=[],callbacks=[],calls=[];
 const react={useState:v=>{const i=cursor++;if(!(i in states))states[i]=v;return[states[i],x=>states[i]=typeof x==='function'?x(states[i]):x];},
  useCallback:(fn,deps)=>{const i=cursor++,old=callbacks[i];if(!old||deps.some((v,j)=>v!==old.deps[j]))callbacks[i]={fn,deps};return callbacks[i].fn;}};
 const m={exports:{}},code=ts.transpileModule(fs.readFileSync('src/services/visaoEstoque/useVisaoEstoque.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>{
  if(name==='react')return react;if(name==='@react-navigation/native')return{useFocusEffect:fn=>{if(fn!==effect){effect=fn;pending=fn;}}};
  if(name.includes('SessionProvider'))return{useSession:()=>({estado:session})};
  if(name==='./visaoEstoqueService')return{observarVisaoEstoque:(c,max,receive,error)=>{const call={c,max,receive,error,closed:0};calls.push(call);return()=>call.closed++;}};
  if(name.includes('utils/visaoEstoque'))return u;throw Error(name);
 },m,m.exports);
 const render=(max=5)=>{cursor=0;return m.exports.useVisaoEstoque(max);};const flush=()=>{if(pending){cleanup?.();cleanup=pending();pending=undefined;}};
 render();flush();calls[0].receive(dados);assert.equal(render().estado.status,'data');cleanup();calls[0].receive(dados);assert.equal(calls[0].closed,1);
 assert.equal(render(50).estado.status,'loading');flush();assert.equal(calls[1].max,50);calls[1].receive(dados);
 session={status:'authenticatedReady',conta:{uid:'b'},perfil:{estabelecimentoId:'outro'}};assert.equal(render(50).estado.status,'loading');flush();assert.equal(calls[1].closed,1);
 calls[1].receive(dados);assert.equal(render(50).estado.status,'loading');calls[2].error({code:'firestore/unavailable'});assert.equal(render(50).estado.status,'error');render(50).tentarNovamente();render(50);flush();assert.equal(calls[2].closed,1);
 session={status:'unauthenticated'};assert.equal(render(50).estado.status,'loading');flush();assert.equal(calls[3].closed,1);assert.equal(calls.length,4);
});

test('11A Home assina apenas produtos/setores, sem query de movimentos; cleanup e cache corretos',()=>{
 const e=iniciar(false,0);assert.equal(e.listeners.length,2);
 e.listeners[0].receive(vazio());assert.equal(e.recebidos.length,0);
 e.listeners[1].receive(vazio());assert.equal(e.recebidos.length,1);assert.equal(e.recebidos[0].emCache,false);assert.deepEqual(e.recebidos[0].movimentos,[]);
 e.stop();e.stop();assert.ok(e.listeners.every(l=>l.closed===1));
 e.listeners[0].receive(vazio());assert.equal(e.recebidos.length,1);
 const cache=iniciar(false,0);cache.listeners[0].receive(vazio(true));cache.listeners[1].receive(vazio());assert.equal(cache.recebidos[0].emCache,true);cache.stop();
});
