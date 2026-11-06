const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
function load(file, imports) {
  const m = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})')(name => {
    if (name === 'react/jsx-runtime') return jsx;
    if (name in imports) return imports[name];
    throw Error('Import inesperado: ' + name);
  }, m, m.exports);
  return m.exports.default;
}
function nodes(tree) {
  return tree && typeof tree === 'object' ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
}
test('Welcome abre os formulários existentes e mantém ações acessíveis em tela pequena/fonte grande', () => {
  let dimensions = { width: 360, height: 740, fontScale: 1 };
  const calls = [];
  const screen = load('src/screens/auth/WelcomeScreen.tsx', {
    'react-native': { Image: 'image', ScrollView: 'scroll', Text: 'text', View: 'view', StyleSheet: { create: x => x }, useWindowDimensions: () => dimensions },
    'react-native-safe-area-context': { SafeAreaView: 'safe', useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }) },
    '../../components/ui/AppButton': { AppButton: 'button' },
    '../../theme': { colors: {}, fonts: {}, spacing: { xxl: 24, lg: 16, sm: 8 } },
    '../../../assets/setority-adaptive-foreground.png': 'official-image',
  });
  const render = () => nodes(screen({ navigation: { navigate: name => calls.push(name) } }));
  assert.equal(render().some(n => n.type === 'scroll'), false);
  for (const label of ['Entrar', 'Criar conta']) render().find(n => n.props.label === label).props.onPress();
  assert.deepEqual(calls, ['Login', 'Cadastro']);
  dimensions = { width: 320, height: 480, fontScale: 2 };
  assert.ok(render().some(n => n.type === 'scroll'));
  assert.equal(render().filter(n => n.type === 'button').length, 2);
});
test('Root conserva loading, onboarding, sessão pronta e erro; Auth só existe deslogado', () => {
  let estado;
  const root = load('src/navigation/RootNavigator.tsx', {
    '@react-navigation/stack': { createStackNavigator: () => ({ Navigator: 'navigator', Screen: 'route' }) },
    '../session/SessionProvider': { useSession: () => ({ estado }) },
    './AuthNavigator': 'auth', './AuthenticatedNavigator': 'app', '../theme/navigation': { appHeaderOptions: {} },
    '../screens/auth/CriarEstabelecimentoScreen': 'onboarding', '../screens/auth/LoadingScreen': 'loading',
    '../components/LogoutButton': 'logout', '../components/AuthFormLayout': { AuthFormLayout: 'form', FormButton: 'button' },
    '../screens/conta/ContaScreen': 'account',
  });
  for (const [status, routes] of Object.entries({ loading: ['Loading'], unauthenticated: ['Auth'], authenticatedWithoutProfile: ['Onboarding'], authenticatedReady: ['Stock', 'Conta'], error: ['Error'] })) {
    estado = { status, conta: { uid: 'A' }, perfil: { estabelecimentoId: 'e' } };
    assert.deepEqual(nodes(root()).filter(n => n.type === 'route').map(n => n.props.name), routes);
  }
});
