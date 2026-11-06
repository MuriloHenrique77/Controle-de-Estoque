const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function appHarness() {
  const state = { fonts: [false, null], hides: 0, prevents: 0, warnings: [], rejectHide: false };
  const ref = { current: false };
  const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
  const imports = {
    'react/jsx-runtime': jsx,
    react: { useCallback: callback => callback, useRef: () => ref },
    'expo-font': { useFonts: () => state.fonts },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider' },
    '@react-navigation/native': { NavigationContainer: 'NavigationContainer' },
    './src/navigation/RootNavigator': { default: 'Navigator' },
    './src/session/SessionProvider': { SessionProvider: 'SessionProvider' },
    './src/components/BootScreen': { default: 'Boot' },
    './src/theme/navigation': { navigationTheme: {} },
    './src/components/ui/FeedbackProvider': { FeedbackProvider: 'FeedbackProvider' },
    'expo-splash-screen': {
      preventAutoHideAsync: () => { state.prevents++; return Promise.resolve(true); },
      hideAsync: () => { state.hides++; return state.rejectHide ? Promise.reject(Error('private-error-details')) : Promise.resolve(); },
    },
  };
  for (const [weight, suffix] of [['400','Regular'],['500','Medium'],['600','SemiBold'],['700','Bold']]) {
    imports[`@expo-google-fonts/inter/${weight}${suffix}`] = { [`Inter_${weight}${suffix}`]: 'local-asset' };
  }
  const source = ts.transpileModule(fs.readFileSync('App.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    require: name => { assert.ok(name in imports, `Import inesperado: ${name}`); return imports[name]; },
    module, exports: module.exports,
    console: { warn: (...args) => state.warnings.push(args.join(' ')) },
  });
  return { state, App: module.exports.default };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('raiz libera splash mesmo com fontes pendentes e nenhum evento de imagem/sessão', async () => {
  const { App, state } = appHarness();
  const root = App();
  assert.equal(root.type, 'SafeAreaProvider');
  assert.equal(root.props.children[1].type, 'Boot');
  assert.equal(state.prevents, 1);
  assert.equal(state.hides, 0);
  root.props.onLayout();
  await settle();
  assert.equal(state.hides, 1);
});

test('fontes prontas e Boot substituído antes da imagem não deixam splash retida', async () => {
  const { App, state } = appHarness();
  const loadingRoot = App();
  state.fonts = [true, null];
  const navigationRoot = App();
  assert.equal(navigationRoot.props.children[1].type, 'FeedbackProvider');
  // Nenhum onLoadEnd do Boot acontece, como na corrida observada no A54.
  navigationRoot.props.onLayout();
  loadingRoot.props.onLayout();
  navigationRoot.props.onLayout();
  await settle();
  assert.equal(state.hides, 1);
});

test('erro de fonte mantém tela React de erro sem prender a splash nativa', async () => {
  const { App, state } = appHarness();
  state.fonts = [false, Error('font unavailable')];
  const root = App();
  assert.equal(root.props.children[1].props.erro, true);
  root.props.onLayout();
  await settle();
  assert.equal(state.hides, 1);
});

test('falha de hideAsync é tratada sem dados técnicos e permite nova tentativa de layout', async () => {
  const { App, state } = appHarness();
  state.rejectHide = true;
  const root = App();
  root.props.onLayout();
  await settle();
  assert.equal(state.warnings.length, 1);
  assert.equal(state.warnings[0].includes('private-error-details'), false);
  state.rejectHide = false;
  root.props.onLayout();
  await settle();
  assert.equal(state.hides, 2);
});
