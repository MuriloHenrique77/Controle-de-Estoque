const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
// Render/efeitos separados para testar a janela anterior ao cleanup da navegação.
function harness(file,hook,service,callbackName,field,params) {
 let cursor=0,pending,cleanup,effect,focused=true,session={status:'authenticatedReady',conta:{uid:'a'},perfil:{estabelecimentoId:'est_a'}};
 const states=[],callbacks=[],calls=[];
 const react={useState:initial=>{const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useCallback:(fn,deps)=>{const i=cursor++,old=callbacks[i];if(!old||deps.some((d,j)=>d!==old.deps[j]))callbacks[i]={fn,deps};return callbacks[i].fn;}};
 const m={exports:{}},code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>{
  if(name==='react')return react;
  if(name==='@react-navigation/native')return {useFocusEffect:fn=>{if(fn!==effect){effect=fn;pending=fn;}}};
  if(name.includes('SessionProvider'))return {useSession:()=>({estado:session})};
  if(name===service)return {[callbackName]:(...args)=>{const c={args,receive:args.at(-2),error:args.at(-1),closed:0};calls.push(c);return()=>c.closed++;}};
  if(name.includes('/utils/'))return new Proxy({},{get:()=>e=>e.message});
  throw Error('Import não esperado: '+name);
 },m,m.exports);
 const render=(args=params)=>{cursor=0;return m.exports[hook](...args);};
 const flush=()=>{if(pending){cleanup?.();cleanup=focused?pending():undefined;pending=undefined;}};
 return {calls,render,flush,session:s=>session=s,blur:()=>{focused=false;cleanup?.();cleanup=undefined;},focus:()=>{focused=true;cleanup=effect();},field};
}
for(const [file,hook,service,method,field,params] of [
 ['src/services/setores/useSetores.ts','useSetores','./setoresService','observarSetores','setores',[]],
 ['src/services/produtos/useProdutos.ts','useProdutos','./produtosService','observarProdutos','produtos',['s1']],
 ['src/services/movimentacoes/useMovimentacoesProduto.ts','useMovimentacoesProduto','./movimentacoesService','observarMovimentacoesProduto','movimentos',['p1','s1']],
])test(hook+': foco, parâmetros, retry e isolamento antes de efeitos',()=>{
 const h=harness(file,hook,service,method,field,params);
 assert.equal(h.render().estado.status,'loading');h.flush();h.calls[0].receive([{id:'dado_a'}]);assert.equal(h.render().estado.status,'data');
 h.blur();assert.equal(h.calls[0].closed,1);h.calls[0].receive([{id:'tardio'}]);assert.equal(h.render().estado[field][0].id,'dado_a');
 h.focus();assert.equal(h.render().estado.status,'loading');h.calls[1].receive([]);assert.equal(h.render().estado.status,'data');
 const novo=params.map(x=>x+'_novo');h.render(novo);h.flush();if(params.length){assert.equal(h.calls[1].closed,1);assert.equal(h.render(novo).estado.status,'loading');}
 const last=h.calls.at(-1);last.error(new Error('falha'));assert.equal(h.render(novo).estado.status,'error');h.render(novo).tentarNovamente();h.render(novo);h.flush();assert.equal(last.closed,1);
 h.calls.at(-1).receive([{id:'dado_a'}]);assert.equal(h.render(novo).estado.status,'data');
 h.session({status:'authenticatedReady',conta:{uid:'b'},perfil:{estabelecimentoId:'est_b'}});assert.equal(h.render(novo).estado.status,'loading');h.flush();assert.deepEqual(h.calls.at(-1).args[0],{uid:'b',estabelecimentoId:'est_b'});
 for(const c of h.calls.slice(0,-1))c.receive([{id:'dado_a_tardio'}]);assert.equal(h.render(novo).estado.status,'loading');
 h.session({status:'unauthenticated'});assert.equal(h.render(novo).estado.status,'loading');h.flush();assert.ok(h.calls.every(c=>c.closed===1));
});
