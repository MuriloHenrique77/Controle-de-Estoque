const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('formulário revela um novo erro por rolagem e não desloca conteúdo ao continuar editando',()=>{
 const calls=[],pending=[];let previous;const ref={current:{scrollTo:options=>calls.push(options)}};
 const react={useRef:()=>ref,useEffect:(fn,deps)=>{if(!previous||deps.some((v,i)=>v!==previous[i]))pending.push(fn);previous=deps;}};
 const imports={react:{...react,default:react},'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},'react-native':{KeyboardAvoidingView:'keyboard',Platform:{OS:'android'},ScrollView:'scroll',StyleSheet:{create:s=>s},Text:'text',View:'view'},'@react-navigation/elements':{useHeaderHeight:()=>56},'./ui/AppButton':{AppButton:'button'},'react-native-safe-area-context':{SafeAreaView:'safe'},'../theme':{colors:{},spacing:{},radii:{},typography:{},touchTarget:48}};
 const m={exports:{}},code=ts.transpileModule(fs.readFileSync('src/components/AuthFormLayout.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(n=>{if(n in imports)return imports[n];throw Error('Import inesperado '+n);},m,m.exports);
 const render=erro=>{m.exports.AuthFormLayout({title:'Produto',subtitle:'Setor',erro});while(pending.length)pending.shift()();};
 render(null);assert.equal(calls.length,0);render('Informe o nome do produto.');assert.deepEqual(calls,[{y:0,animated:true}]);render('Informe o nome do produto.');assert.equal(calls.length,1);render(null);render('É necessária conexão.');assert.equal(calls.length,2);
});
