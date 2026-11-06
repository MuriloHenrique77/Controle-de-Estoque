const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
function load(file,imports){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(n=>{if(n in imports)return imports[n];throw Error(n);},m,m.exports);return m.exports;}
test('release versão tem uma fonte: app.json, sem texto hardcoded na UI',()=>{
 const config={expo:{version:'9.2.3'}};
 const util=load('src/utils/versaoApp.ts',{'../../app.json':{default:config}});
 assert.equal(util.obterVersaoApp(),'9.2.3');config.expo.version='9.2.4';assert.equal(util.obterVersaoApp(),'9.2.4');
 assert.equal(require('../package.json').version,require('../app.json').expo.version);
 assert.equal(require('../package-lock.json').packages[''].version,require('../app.json').expo.version);
});
test('Boot preserva asset, proporção, versão com safe area e erro sem delay',()=>{
 const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
 const Boot=load('src/components/BootScreen.tsx',{'react/jsx-runtime':jsx,'react-native':{ActivityIndicator:'spinner',Image:'image',Text:'text',View:'view',useWindowDimensions:()=>({width:360,height:740}),StyleSheet:{create:x=>x}},'react-native-safe-area-context':{useSafeAreaInsets:()=>({left:5,right:0,bottom:24})},'../theme':{colors:{},fonts:{},spacing:{xxxl:32,xxl:24,lg:16,md:12},typography:{caption:{},body:{}}},'../utils/versaoApp':{obterVersaoApp:()=> '9.2.3'},'../../assets/setority-adaptive-foreground.png':'official'}).default;
 const tree=Boot({});const image=tree.props.children[0],status=tree.props.children[2],version=tree.props.children[3];
 assert.equal(image.props.source,'official');assert.equal(image.props.resizeMode,'contain');assert.equal(status.props.children.type,'spinner');
 assert.deepEqual(version.props.children,['v','9.2.3']);assert.equal(version.props.style[1].left,29);assert.equal(version.props.style[1].bottom,40);
 assert.equal(Boot({erro:true}).props.children[2].props.children.type,'text');
 assert.equal(/setTimeout|setInterval/.test(fs.readFileSync('src/components/BootScreen.tsx','utf8')),false);
});
