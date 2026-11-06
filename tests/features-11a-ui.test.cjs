const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
const {ambiente}=require('./helpers/produtos-ambiente.cjs');
const theme={colors:{},spacing:{sm:8,md:12,lg:16},typography:{},touchTarget:ambiente().carregar('src/theme/spacing.ts').touchTarget};
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const native={View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:x=>x}};
function load(file,imports){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(n=>n==='react/jsx-runtime'?jsx:n in imports?imports[n]:(()=>{throw Error(n)})(),m,m.exports);return m.exports;}
function nodes(t){return t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];}
test('11A Home conserva indicadores e ações rápidas, sem recentes nem lacuna substituta',()=>{
 const calls=[],limits=[],dados={produtos:[],setores:[],movimentos:[],emCache:false};
 const Home=load('src/screens/home/HomeScreen.tsx',{
  react:{useMemo:f=>f()},'react-native':native,'../../session/SessionProvider':{useSession:()=>({estado:{status:'authenticatedReady',estabelecimento:{nome:'Teste'}}})},
  '../../services/visaoEstoque/useVisaoEstoque':{useVisaoEstoque:max=>{limits.push(max);return{estado:{status:'data',dados},estabelecimentoId:'est'};}},
  '../../utils/visaoEstoque':ambiente().carregar('src/utils/visaoEstoque.ts'),'../../theme':theme,
  '../../components/ui/AppScreen':{AppScreen:'screen'},'../../components/ui/AppCard':{AppCard:'card'},'../../components/ui/AppButton':{AppButton:'button'},
  '../../components/ui/ScreenState':{ErrorState:'error',LoadingState:'loading'},'../../components/ui/SectionHeader':{SectionHeader:'section'},'../../components/ui/StatusBadge':{StatusBadge:'badge'},
 }).default;
 const tree=nodes(Home({navigation:{navigate:(...x)=>calls.push(x)}}));assert.deepEqual(limits,[0]);
 assert.deepEqual(tree.filter(x=>x.type==='section').map(x=>x.props.title),['Resumo do estoque','Ações rápidas']);
 for(const label of ['Novo produto','Entrada','Saída'])tree.find(x=>x.props.label===label).props.onPress();
 assert.deepEqual(calls.map(x=>x[1].params.acao),['produto','entrada','saida']);
});
for(const [status,possuiHistorico] of [['ativo',false],['ativo',true],['inativo',false],['inativo',true],[undefined,undefined]])test('11A produto '+(status??'legado')+' histórico='+possuiHistorico+' só oferece ciclo sem excluir',()=>{
 const component=load('src/components/ProdutoLifecycleActions.tsx',{
  react:{useEffect:()=>{},useRef:x=>({current:x}),useState:x=>[x,()=>{}]},'react-native':native,
  '../utils/produtos':{mensagemErroProdutos:()=>''},'../utils/cicloProduto':{mensagemInativacao:()=>''},
  '../services/produtos/produtosService':{},'../theme':theme,'./ui/AppButton':{AppButton:'button'},'./ui/FeedbackProvider':{useFeedback:()=>()=>{}},'./ConfirmModal':{default:'modal'},
 }).ProdutoLifecycleActions;
 const tree=nodes(component({produto:{id:'p',status,possuiHistorico},contexto:{uid:'a',estabelecimentoId:'est'}}));
 assert.deepEqual(tree.filter(x=>x.type==='button').map(x=>x.props.label),[status==='inativo'?'Reativar produto':'Inativar produto']);
 assert.equal(JSON.stringify(tree).includes('Excluir'),false);
});
test('11A checkbox tem label clicável, checked/disabled e alvo real de 48dp',()=>{
 const Checkbox=load('src/components/ui/AppCheckbox.tsx',{'react-native':native,'@expo/vector-icons':{Ionicons:'icon'},'../../theme':theme}).AppCheckbox;
 const changes=[],x=Checkbox({label:'Adicionar vendedor',checked:false,onChange:v=>changes.push(v)});
 assert.equal(x.props.accessibilityRole,'checkbox');assert.equal(x.props.accessibilityLabel,'Adicionar vendedor');assert.equal(x.props.accessibilityState.checked,false);assert.equal(x.props.style[0].minHeight,48);x.props.onPress();assert.deepEqual(changes,[true]);
 const disabled=Checkbox({label:'Adicionar vendedor',checked:true,disabled:true,onChange:()=>{}});assert.equal(disabled.props.disabled,true);assert.equal(disabled.props.accessibilityState.checked,true);
});
test('11A linha de vendedor omite ausência e entradas, preserva nome completo em saída',()=>{
 const Line=load('src/components/ui/VendedorLinha.tsx',{'react-native':native,'../../theme':theme}).VendedorLinha;
 assert.equal(Line({movimento:{tipo:'saida'}}),null);assert.equal(Line({movimento:{tipo:'entrada',vendedorNome:'Carlos'}}),null);
 assert.deepEqual(Line({movimento:{tipo:'saida',vendedorNome:'Carlos Henrique'}}).props.children,['Vendedor: ','Carlos Henrique']);
});
function form(tipo='saida',movimentacao){
 let cursor=0;const state=[],calls=[];const a=ambiente();
 const react={useEffect:()=>{},useRef:x=>({current:x}),useState:initial=>{const i=cursor++;if(!(i in state))state[i]=initial;return[state[i],v=>state[i]=v];}};
 const Form=load('src/screens/setores/MovimentacaoFormScreen.tsx',{
  react,'react-native':{...native,TextInput:'input'},'../../components/AuthFormLayout':{AuthFormLayout:'layout',FormButton:'button',authStyles:{}},
  '../../services/produtos/useProdutos':{useProdutos:()=>({estado:{status:'data',produtos:[{id:'p',status:'ativo'}]}})},'../../utils/cicloProduto':{produtoAtivo:()=>true},
  '../../session/SessionProvider':{useSession:()=>({estado:{status:'authenticatedReady',conta:{uid:'a'},perfil:{estabelecimentoId:'est'}}})},
  '../../utils/produtos':a.carregar('src/utils/produtos.ts'),'../../utils/movimentacoes':a.carregar('src/utils/movimentacoes.ts'),
  '../../services/movimentacoes/movimentacoesService':{registrarEntrada:async(...x)=>calls.push(['entrada',x.at(-1)]),registrarSaida:async(...x)=>calls.push(['saida',x.at(-1)]),editarMovimentacao:async(...x)=>calls.push(['editar',x.at(-1)])},
  '../../components/ui/FeedbackProvider':{useFeedback:()=>()=>{}},'../../components/ui/AppInput':{AppInput:'vendedor'},'../../components/ui/AppCheckbox':{AppCheckbox:'checkbox'},
 }).default;
 const render=()=>{cursor=0;return nodes(Form({route:{params:{produtoId:'p',setor:{id:'s',estabelecimentoId:'est'},tipo,movimentacao}},navigation:{goBack:()=>{}}}));};
 return{calls,render};
}
test('11A formulário exige vendedor somente quando marcado e envia ausência real',async()=>{
 const f=form();let tree=f.render();tree.find(x=>x.props.accessibilityLabel==='Quantidade').props.onChangeText('4');
 assert.equal(tree.some(x=>x.type==='vendedor'),false);tree.find(x=>x.type==='checkbox').props.onChange(true);tree=f.render();
 tree.find(x=>x.type==='button').props.onPress();assert.match(f.render()[0].props.erro,/nome do vendedor/);assert.equal(f.calls.length,0);
 tree=f.render();assert.equal(tree.find(x=>x.type==='vendedor').props.maxLength,undefined);tree.find(x=>x.type==='vendedor').props.onChangeText(' Carlos Henrique ');f.render().find(x=>x.type==='button').props.onPress();await new Promise(setImmediate);
 assert.equal(f.calls[0][1].vendedorNome,'Carlos Henrique');
});
test('11A edição inicializa vendedor, desmarcar omite campo; entrada nunca mostra checkbox',async()=>{
 const f=form('saida',{id:'m',quantidade:4,vendedorNome:'Carlos'});let t=f.render();assert.equal(t.find(x=>x.type==='checkbox').props.checked,true);assert.equal(t.find(x=>x.type==='vendedor').props.value,'Carlos');
 t.find(x=>x.type==='checkbox').props.onChange(false);t=f.render();assert.equal(t.some(x=>x.type==='vendedor'),false);t.find(x=>x.type==='button').props.onPress();await new Promise(setImmediate);assert.equal('vendedorNome' in f.calls[0][1],false);
 assert.equal(form('entrada',{quantidade:4}).render().some(x=>x.type==='checkbox'||x.type==='vendedor'),false);
});
