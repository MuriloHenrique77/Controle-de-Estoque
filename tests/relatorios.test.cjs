const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
function ambiente(sincrono = false) {
  const listeners = [], auth = {currentUser:{uid:'a'}}, cache = new Map();
  class Timestamp { constructor(date) { this.date = new Date(date); } toDate() { return new Date(this.date); } }
  const sdk = {Timestamp, collection: (_,name)=>({name}), query:(collection,...filters)=>({collection,filters}),
    where:(field,operator,value)=>({field,operator,value}), orderBy:(field,direction)=>({field,direction}),
    onSnapshot:(query,options,receive,error)=>{const l={query,options,receive,error,closed:0};listeners.push(l);
      if(sincrono)error(new Error('falha síncrona'));return()=>l.closed++;}};
  function carregar(file) {
    file=path.resolve(file);if(cache.has(file))return cache.get(file);
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    const m={exports:{}};
    vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>{
      if(name==='@react-native-firebase/firestore')return sdk;
      if(name.endsWith('/firebase/auth'))return {obterAuth:()=>auth};
      if(name.endsWith('/firebase/firestore'))return {obterFirestore:()=>({})};
      return carregar(path.resolve(path.dirname(file),name+'.ts'));
    },m,m.exports);cache.set(file,m.exports);return m.exports;
  }
  return {carregar,listeners,auth,Timestamp};
}
const a=ambiente(), {agregarRelatorio:agregar}=a.carregar('src/utils/relatorios.ts');
const datas=a.carregar('src/utils/periodoRelatorio.ts');
const periodo=datas.construirIntervaloRelatorio('01/10/2026','05/10/2026');
const setor=(id)=>({id,estabelecimentoId:'est',nome:id,criadoEm:new Date()});
const produto=(id,setorId='s1',estoqueAtual=9,estoqueMinimo)=>({id,setorId,estabelecimentoId:'est',nome:id,estoqueAtual,estoqueMinimo,quantidadeInicial:0,criadoEm:new Date()});
const mov=(id,produtoId,tipo,quantidade,criadoEm=new Date(2026,9,2,12),setorId='s1')=>({id,produtoId,tipo,quantidade,criadoEm,setorId,estabelecimentoId:'est',criadoPor:'a'});
const base={produtos:[produto('A'),produto('B'),produto('C','s2',4,5)],setores:[setor('s1'),setor('s2')],emCache:false,
  movimentos:[mov('a1','A','entrada',10),mov('a2','A','entrada',5),mov('a3','A','saida',4),mov('a4','A','saida',2),mov('c1','C','entrada',12,undefined,'s2'),mov('c2','C','saida',7,undefined,'s2')]};
const calcular=(f={},d=base)=>agregar('est',d,{...periodo,...f});
test('totais 10+5, 4+2, saldo 9 e produto distinto',()=>{const r=calcular({produtoId:'A'}).resumo;assert.deepEqual(r,{totalEntradas:15,totalSaidas:6,saldoPeriodo:9,quantidadeMovimentacoes:4,produtosMovimentados:1});});
test('rankings somam movimentos: A 15 supera C 12; C saída 7 supera A 6',()=>{const r=calcular();assert.deepEqual(r.maioresEntradas.map(x=>[x.produto.id,x.quantidade]),[['A',15],['C',12]]);assert.deepEqual(r.maioresSaidas.map(x=>[x.produto.id,x.quantidade]),[['C',7],['A',6]]);});
test('sem movimento é B no período e independe do tipo',()=>{for(const tipo of [undefined,'entrada','saida'])assert.deepEqual(calcular({tipo}).semMovimentacao.map(p=>p.id),['B']);});
test('reposição <= mínimo, ausente não repõe; saldo período difere do estoque atual',()=>{const d={...base,produtos:[produto('A','s1',4,5),produto('B','s1',5,5),produto('C','s2',6,5),produto('D','s2',0)]};const r=calcular({},d);assert.deepEqual(r.reposicao.map(p=>p.id),['A','B']);assert.deepEqual(r.zerados.map(p=>p.id),['D']);assert.equal(r.resumo.saldoPeriodo,14);assert.equal(d.produtos[0].estoqueAtual,4);});
test('setor + produto + tipo combinados; totais por setor e produto fora da seleção',()=>{assert.equal(calcular({setorId:'s1',produtoId:'A',tipo:'entrada'}).resumo.totalEntradas,15);assert.equal(calcular({setorId:'s1',produtoId:'C'}).movimentos.length,0);assert.deepEqual(calcular().porSetor.map(s=>[s.setorId,s.entradas,s.saidas]),[['s1',15,6],['s2',12,7]]);});
test('período vazio conserva reposição atual e identifica todos sem movimento',()=>{const r=calcular(datas.construirIntervaloRelatorio('01/09/2026','30/09/2026'));assert.equal(r.resumo.quantidadeMovimentacoes,0);assert.deepEqual(r.semMovimentacao.map(p=>p.id),['A','B','C']);assert.deepEqual(r.reposicao.map(p=>p.id),['C']);});
test('ordem recente primeiro e empate determinístico por nome e ID',()=>{const d={...base,produtos:[produto('Z'),produto('A')],movimentos:[mov('1','Z','entrada',5,new Date(2026,9,1)),mov('2','A','entrada',5,new Date(2026,9,3))]};const r=calcular({},d);assert.deepEqual(r.maioresEntradas.map(x=>x.produto.id),['A','Z']);assert.deepEqual(r.movimentos.map(x=>x.movimento.id),['2','1']);d.produtos.forEach(p=>p.nome='Mesmo');assert.deepEqual(calcular({},d).maioresEntradas.map(x=>x.produto.id),['A','Z']);});
test('limites início inclusive, último milissegundo e dia seguinte exclusivo',()=>{const p=datas.construirIntervaloRelatorio('05/10/2026','05/10/2026');const times=[p.inicio.getTime()-1,p.inicio.getTime(),p.fimExclusivo.getTime()-1,p.fimExclusivo.getTime()];const d={...base,movimentos:times.map((t,i)=>mov(String(i),'A','entrada',1,new Date(t)))};assert.deepEqual(calcular(p,d).movimentos.map(x=>x.movimento.id),['2','1']);});
test('datas inválidas, reversas, bissexto e virada do mês',()=>{for(const [ini,fim] of [['31/02/2026','05/03/2026'],['2026-01-01','02/01/2026'],['06/10/2026','05/10/2026'],['29/02/2025','01/03/2025']])assert.throws(()=>datas.construirIntervaloRelatorio(ini,fim));assert.equal(datas.construirIntervaloRelatorio('29/02/2024','29/02/2024').fimExclusivo.getDate(),1);assert.deepEqual(datas.periodoPadrao(new Date(2026,9,5)),{inicial:'01/10/2026',final:'05/10/2026'});});
test('dias de 23/25 horas respeitam calendário local, sem somar 24h',()=>{const original=process.env.TZ;try{process.env.TZ='America/New_York';for(const [dia,horas] of [['08/03/2026',23],['01/11/2026',25]]){const p=datas.construirIntervaloRelatorio(dia,dia);assert.equal((p.fimExclusivo-p.inicio)/3600000,horas);assert.equal(p.fimExclusivo.getHours(),0);}}finally{if(original===undefined)delete process.env.TZ;else process.env.TZ=original;}});
test('fuso do dispositivo determina limites UTC sem parsing textual ambíguo',()=>{const original=process.env.TZ;try{for(const [tz,inicio,fim] of [['America/Sao_Paulo','2026-10-05T03:00:00.000Z','2026-10-06T03:00:00.000Z'],['Asia/Tokyo','2026-10-04T15:00:00.000Z','2026-10-05T15:00:00.000Z']]){process.env.TZ=tz;const p=datas.construirIntervaloRelatorio('05/10/2026','05/10/2026');assert.equal(p.inicio.toISOString(),inicio);assert.equal(p.fimExclusivo.toISOString(),fim);}}finally{if(original===undefined)delete process.env.TZ;else process.env.TZ=original;}});
test('recusa mistura de estabelecimentos, quantidade inválida e overflow',()=>{assert.throws(()=>calcular({}, {...base,produtos:[{...base.produtos[0],estabelecimentoId:'outro'}]}));assert.throws(()=>calcular({}, {...base,movimentos:[mov('x','A','entrada',0)]}));assert.throws(()=>calcular({}, {...base,movimentos:[mov('x','A','entrada',Number.MAX_SAFE_INTEGER),mov('y','A','entrada',1)]}),/limite/);});
function iniciar(sync=false){const e=ambiente(sync),recebidos=[],erros=[];const stop=e.carregar('src/services/relatorios/relatoriosService.ts').observarRelatorio({uid:'a',estabelecimentoId:'est'},periodo,d=>recebidos.push(d),err=>erros.push(err));return {...e,recebidos,erros,stop};}
const vazio=(cache=false)=>({docs:[],metadata:{fromCache:cache,hasPendingWrites:false}});
test('exatamente três consultas seguras, range e order, espera todas; metadata cache e cleanup idempotente',()=>{const e=iniciar();assert.equal(e.listeners.length,3);for(const l of e.listeners){assert.deepEqual(l.query.filters[0],{field:'estabelecimentoId',operator:'==',value:'est'});assert.equal(l.options.includeMetadataChanges,true);}assert.deepEqual(e.listeners[2].query.filters.slice(1).map(f=>f.operator||f.direction),['>=','<','desc']);e.listeners[0].receive(vazio());e.listeners[1].receive(vazio());assert.equal(e.recebidos.length,0);e.listeners[2].receive(vazio(true));assert.equal(e.recebidos.at(-1).emCache,true);e.listeners[2].receive(vazio());assert.equal(e.recebidos.at(-1).emCache,false);e.stop();e.stop();assert.ok(e.listeners.every(l=>l.closed===1));e.listeners[0].receive(vazio());assert.equal(e.recebidos.length,2);});
test('erro é propagado, encerra três listeners e jamais publica vazio',()=>{const e=iniciar();e.listeners[1].error(new Error('indisponível'));assert.equal(e.erros.length,1);assert.equal(e.recebidos.length,0);assert.ok(e.listeners.every(l=>l.closed===1));e.listeners[2].receive(vazio());assert.equal(e.recebidos.length,0);});
test('troca de usuário recusa callback antigo e encerra todos',()=>{const e=iniciar();e.auth.currentUser={uid:'b'};e.listeners[0].receive(vazio());assert.equal(e.erros.length,1);assert.equal(e.recebidos.length,0);assert.ok(e.listeners.every(l=>l.closed===1));});
test('erro síncrono na aquisição não vaza assinatura nem cria listeners adicionais',()=>{const e=iniciar(true);assert.equal(e.listeners.length,1);assert.equal(e.listeners[0].closed,1);assert.equal(e.erros.length,1);e.stop();assert.equal(e.listeners[0].closed,1);});
test('documento inconsistente não vira resultado vazio',()=>{const e=iniciar();e.listeners[0].receive({docs:[{id:'p',data:()=>({setorId:42}),metadata:{hasPendingWrites:false}}],metadata:{fromCache:false}});assert.equal(e.erros.length,1);assert.equal(e.recebidos.length,0);});

test('hook bloqueia dados antigos antes dos efeitos, faz cleanup em blur, período e sessão, e permite retry',()=>{
  let cursor=0, session={status:'authenticatedReady',conta:{uid:'a'},perfil:{estabelecimentoId:'est'}},pending,cleanup,focused=true;
  const states=[],callbacks=[],calls=[];
  const react={useState:initial=>{const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},
    useCallback:(fn,deps)=>{const i=cursor++,old=callbacks[i];if(!old||deps.some((d,j)=>d!==old.deps[j]))callbacks[i]={fn,deps};return callbacks[i].fn;}};
  let effect;
  const nav={useFocusEffect:fn=>{if(fn!==effect){effect=fn;pending=fn;}}};
  const file=path.resolve('src/services/relatorios/useRelatorios.ts'),m={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>{
    if(name==='react')return react;if(name==='@react-navigation/native')return nav;
    if(name.includes('SessionProvider'))return{useSession:()=>({estado:session})};
    if(name==='./relatoriosService')return {observarRelatorio:(context,p,receive,error)=>{const call={context,p,receive,error,closed:0};calls.push(call);return()=>call.closed++;}};
    if(name.includes('utils/relatorios'))return {mensagemErroRelatorio:e=>e.message};throw Error(name);
  },m,m.exports);
  const render=p=>{cursor=0;return m.exports.useRelatorios(p||periodo);};
  const flush=()=>{if(pending){cleanup?.();cleanup=focused?pending():undefined;pending=undefined;}};
  assert.equal(render().estado.status,'loading');flush();calls[0].receive(base);assert.equal(render().estado.status,'data');
  session={status:'authenticatedReady',conta:{uid:'b'},perfil:{estabelecimentoId:'outro'}};
  assert.equal(render().estado.status,'loading');flush();assert.equal(calls[0].closed,1);
  calls[0].receive(base);assert.equal(render().estado.status,'loading');calls[1].receive({...base,produtos:[],setores:[],movimentos:[]});assert.equal(render().estado.status,'data');
  const novo=datas.construirIntervaloRelatorio('01/09/2026','30/09/2026');assert.equal(render(novo).estado.status,'loading');flush();assert.equal(calls[1].closed,1);
  calls[2].error(new Error('falhou'));assert.equal(render(novo).estado.status,'error');render(novo).tentarNovamente();render(novo);flush();assert.equal(calls[2].closed,1);assert.equal(render(novo).estado.status,'loading');
  focused=false;cleanup();assert.equal(calls[3].closed,1);calls[3].receive(base);assert.equal(render(novo).estado.status,'loading');
  session={status:'unauthenticated'};assert.equal(render(novo).estado.status,'loading');flush();assert.equal(calls.length,4);
});
