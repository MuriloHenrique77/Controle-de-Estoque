const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={}){
 const m={exports:{}},code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>{if(name in imports)return imports[name];throw Error('Import inesperado: '+name);},m,m.exports);return m.exports;
}
const utils=load('src/utils/auth.ts');
test('recuperação: email obrigatório, trim e formato básico sem espaços internos',()=>{
 for(const email of ['', '  ','a','a@','a@exemplo','a b@exemplo.com','a@exemplo .com'])assert.ok(utils.validarEmailRecuperacao(email));
 assert.equal(utils.validarEmailRecuperacao('  pessoa+estoque@exemplo.com.br  '),null);
 assert.equal(utils.validarEmailRecuperacao(' '),'Informe seu e-mail.');
});
test('recuperação: erros traduzidos sem código técnico ou detalhes da conta',()=>{
 const expected={
  'auth/invalid-email':'Informe um e-mail válido.',
  'auth/network-request-failed':'É necessária conexão para enviar as instruções de redefinição.',
  'auth/too-many-requests':'Muitas tentativas. Aguarde um pouco e tente novamente.',
 };
 for(const [code,message]of Object.entries(expected))assert.equal(utils.mensagemErroRecuperacao({code}),message);
 for(const code of ['auth/internal-error','auth/operation-not-allowed','auth/app-not-authorized','app/web-unavailable'])assert.match(utils.mensagemErroRecuperacao({code}),/indisponível/);
 for(const error of [new Error('FirebaseError técnico'),null,{code:'auth/user-disabled'},{code:'auth/desconhecido'}])assert.equal(utils.mensagemErroRecuperacao(error),'Não foi possível enviar as instruções. Tente novamente mais tarde.');
 assert.equal(utils.mensagemRecuperacaoEnviada,'Se existir uma conta com este e-mail, enviaremos instruções para redefinir sua senha.');
});
function service(failure){const calls=[],auth={currentUser:{uid:'atual',email:'  Atual@exemplo.test  '}};const s=load('src/services/firebase/session.ts',{
 '@react-native-firebase/auth':{setLanguageCode:async(a,lang)=>calls.push(['idioma',a,lang]),sendPasswordResetEmail:async(a,email)=>{calls.push(['enviar',a,email]);if(failure)throw failure;}},
 '@react-native-firebase/firestore':{},'./auth':{obterAuth:()=>auth},'./firestore':{},'./collections':{},'./converters/onboarding':{},'../../utils/auth':utils,
 });return {...s,calls,auth};}
test('serviço nativo usa pt antes do envio, normaliza email e não opera Firestore',async()=>{
 const s=service();await s.recuperarSenha('  pessoa@exemplo.test  ');assert.deepEqual(s.calls,[['idioma',s.auth,'pt'],['enviar',s.auth,'pessoa@exemplo.test']]);
 const invalid=service();await assert.rejects(()=>invalid.recuperarSenha(' '),/Informe seu e-mail/);assert.equal(invalid.calls.length,0);
});
test('conta inexistente preserva sucesso genérico; demais erros são propagados para tradução',async()=>{
 await service({code:'auth/user-not-found'}).recuperarSenha('ausente@exemplo.test');
 for(const code of ['auth/network-request-failed','auth/too-many-requests','auth/internal-error'])await assert.rejects(()=>service({code}).recuperarSenha('pessoa@exemplo.test'),e=>e.code===code);
});
test('tela bloqueia duplo submit, exibe loading, não atualiza após unmount e permite retry em erro',async()=>{
 let cursor=0,cleanup,pending,requests=0,back=0;const states=[],refs=[];
 const react={useState:v=>{const i=cursor++;if(!(i in states))states[i]=v;return[states[i],x=>states[i]=x];},useRef:v=>{const i=cursor++;return refs[i]??=( {current:v} );},useEffect:fn=>{if(!cleanup)cleanup=fn();}};
 const components={};
 const screen=load('src/screens/auth/RecuperarSenhaScreen.tsx',{
  react:{...react,default:react},'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},
  'react-native':{Text:'text',View:'view',Keyboard:{dismiss:()=>{}},StyleSheet:{create:s=>s}},
  '../../components/ui/AppScreen':{AppScreen:'layout'},'../../components/ui/AppCard':{AppCard:'card'},
  '../../components/ui/AppInput':{AppInput:'input'},'../../components/ui/AppButton':{AppButton:'button'},
  '../../components/ui/SectionHeader':{SectionHeader:'header'},'../../components/ui/FeedbackProvider':{useFeedback:()=>()=>{}},
  '../../theme':{colors:{},spacing:{},typography:{}},
  '../../utils/auth':utils,'../../services/firebase/session':{firebaseNativoDisponivel:true,recuperarSenha:()=>{requests++;return new Promise((resolve,reject)=>pending={resolve,reject});}},
 }).default;
 const render=()=>{cursor=0;return screen({navigation:{goBack:()=>back++}});};
 function nodes(tree){return tree&&typeof tree==='object'?[tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)]:[];}
 let tree=render();nodes(tree).find(n=>n.type==='input').props.onChangeText('pessoa@exemplo.test');tree=render();
 const submit=nodes(tree).find(n=>n.props.label==='Enviar instruções').props.onPress;submit();submit();assert.equal(requests,1);
 tree=render();assert.equal(nodes(tree).find(n=>n.props.label==='Enviando...').props.disabled,true);assert.equal(nodes(tree).find(n=>n.type==='input').props.editable,false);assert.equal(nodes(tree).find(n=>n.props.label==='Enviando...').props.loading,true);
 pending.reject({code:'auth/network-request-failed'});await new Promise(r=>setImmediate(r));tree=render();assert.equal(nodes(tree).find(n=>n.type==='input').props.error,'É necessária conexão para enviar as instruções de redefinição.');
 nodes(tree).find(n=>n.props.label==='Enviar instruções').props.onPress();assert.equal(requests,2);pending.resolve();await new Promise(r=>setImmediate(r));tree=render();assert.ok(nodes(tree).some(n=>n.props.children===utils.mensagemRecuperacaoEnviada));assert.ok(!nodes(tree).some(n=>n.type==='input'));
 nodes(tree).find(n=>n.props.label==='Voltar ao Login').props.onPress();assert.equal(back,1);
 // Retorno de uma solicitação em tela desmontada não muda o estado.
 states[3]=false;tree=render();nodes(tree).find(n=>n.props.label==='Enviar instruções').props.onPress();cleanup();const before=[...states];pending.resolve();await new Promise(r=>setImmediate(r));assert.deepEqual(states,before);
});

test('serviço bloqueia solicitações simultâneas e libera tentativa após conclusão/erro', async()=>{
 let release, sends=0; const s=load('src/services/firebase/session.ts',{
 '@react-native-firebase/auth':{setLanguageCode:async()=>{},sendPasswordResetEmail:()=>{sends++;return new Promise(r=>release=r);}},
 '@react-native-firebase/firestore':{},'./auth':{obterAuth:()=>({})},'./firestore':{},'./collections':{},'./converters/onboarding':{},'../../utils/auth':utils,
 });
 const first=s.recuperarSenha(' Pessoa@exemplo.test ');await new Promise(r=>setImmediate(r));
 await assert.rejects(()=>s.recuperarSenha('outra@exemplo.test'),e=>e.code==='auth/request-in-progress');assert.equal(sends,1);
 release();await first;const second=s.recuperarSenha('Pessoa@exemplo.test');await new Promise(r=>setImmediate(r));assert.equal(sends,2);release();await second;
});
test('erros comuns reutilizam tradução de Login/Cadastro; não expõe conta desativada',()=>{
 for(const code of ['auth/invalid-email','auth/too-many-requests'])assert.equal(utils.mensagemErroRecuperacao({code}),utils.mensagemErroFirebase({code}));
 assert.doesNotMatch(utils.mensagemErroRecuperacao({code:'auth/user-disabled'}),/desativada|user-disabled/);
 assert.match(utils.mensagemErroRecuperacao({code:'auth/request-in-progress'}),/Aguarde/);
});

test('trim preserva caixa do email e falha do SDK libera bloqueio para nova tentativa',async()=>{
 const s=service();await s.recuperarSenha('  Pessoa@Exemplo.test  ');assert.equal(s.calls[1][2],'Pessoa@Exemplo.test');
 const broken=service({code:'auth/network-request-failed'});for(let i=0;i<2;i++)await assert.rejects(()=>broken.recuperarSenha('pessoa@exemplo.test'),e=>e.code==='auth/network-request-failed');assert.equal(broken.calls.filter(c=>c[0]==='enviar').length,2);
});

test('Perfil usa currentUser.email da conta atual, trim e pt; não aceita email da tela',async()=>{
 const s=service();await s.recuperarSenhaDaConta('atual');
 assert.deepEqual(s.calls,[['idioma',s.auth,'pt'],['enviar',s.auth,'Atual@exemplo.test']]);
 s.auth.currentUser={uid:'B',email:'b@exemplo.test'};await s.recuperarSenhaDaConta('B');
 assert.equal(s.calls.at(-1)[2],'b@exemplo.test');
 const antes=s.calls.length;await assert.rejects(()=>s.recuperarSenhaDaConta('atual'),e=>e.code==='auth/reset-session-changed');assert.equal(s.calls.length,antes);
});
test('Perfil bloqueia sessão ausente/trocada e email ausente ou inválido sem chamar Firebase',async()=>{
 for(const user of [null,{uid:'outra',email:'outra@exemplo.test'},{uid:'atual',email:null},{uid:'atual'},{uid:'atual',email:''},{uid:'atual',email:'  '},{uid:'atual',email:'invalido'}]){
  const s=service();s.auth.currentUser=user;await assert.rejects(()=>s.recuperarSenhaDaConta('atual'));assert.deepEqual(s.calls,[]);
 }
 const s=service();await assert.rejects(()=>s.recuperarSenhaDaConta(''));assert.deepEqual(s.calls,[]);
});
test('Perfil não suprime user-not-found, offline ou outros erros; fluxo público mantém enumeração protegida',async()=>{
 for(const code of ['auth/user-not-found','auth/network-request-failed','auth/too-many-requests','auth/internal-error']){
  const s=service({code});await assert.rejects(()=>s.recuperarSenhaDaConta('atual'),e=>e.code===code);
  await assert.rejects(()=>s.recuperarSenhaDaConta('atual'),e=>e.code===code);
  assert.equal(s.calls.filter(c=>c[0]==='enviar').length,2);
 }
 await service({code:'auth/user-not-found'}).recuperarSenha('ausente@exemplo.test');
 assert.equal(utils.mensagemRecuperacaoContaEnviada,'Enviamos as instruções de redefinição de senha para seu e-mail.');
 assert.notEqual(utils.mensagemRecuperacaoContaEnviada,utils.mensagemRecuperacaoEnviada);
 assert.equal(utils.mensagemErroRecuperacaoConta({code:'auth/reset-email-unavailable'}),'Não foi possível identificar o e-mail desta conta.');
 assert.equal(utils.mensagemErroRecuperacaoConta({code:'auth/network-request-failed'}),'Não foi possível enviar o e-mail. Verifique sua conexão e tente novamente.');
 for(const e of [null,new Error('FirebaseError segredo'),{code:'auth/user-not-found'}, {code:'outro',message:'segredo'}])assert.equal(utils.mensagemErroRecuperacaoConta(e),'Não foi possível enviar as instruções de redefinição. Tente novamente.');
});
test('Perfil revalida identidade após idioma; concorrência com fluxo público usa uma trava comum',async()=>{
 let liberarIdioma,liberarEnvio,sends=0;const auth={currentUser:{uid:'A',email:'a@exemplo.test'}};
 const s=load('src/services/firebase/session.ts',{
  '@react-native-firebase/auth':{setLanguageCode:()=>new Promise(r=>liberarIdioma=r),sendPasswordResetEmail:()=>{sends++;return new Promise(r=>liberarEnvio=r);}},
  '@react-native-firebase/firestore':{},'./auth':{obterAuth:()=>auth},'./firestore':{},'./collections':{},'./converters/onboarding':{},'../../utils/auth':utils,
 });
 for(const user of [null,{uid:'B',email:'b@exemplo.test'},{uid:'A',email:'alterado@exemplo.test'}]){
  auth.currentUser={uid:'A',email:'a@exemplo.test'};const p=s.recuperarSenhaDaConta('A');auth.currentUser=user;liberarIdioma();await assert.rejects(()=>p,e=>e.code==='auth/reset-session-changed');assert.equal(sends,0);
 }
 auth.currentUser={uid:'A',email:'a@exemplo.test'};const p=s.recuperarSenhaDaConta('A');
 await assert.rejects(()=>s.recuperarSenhaDaConta('A'),e=>e.code==='auth/request-in-progress');
 await assert.rejects(()=>s.recuperarSenha('a@exemplo.test'),e=>e.code==='auth/request-in-progress');
 liberarIdioma();await new Promise(r=>setImmediate(r));assert.equal(sends,1);liberarEnvio();await p;
});
