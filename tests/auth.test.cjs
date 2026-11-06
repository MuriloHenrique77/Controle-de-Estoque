const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Somente o valor Timestamp é substituído; nenhuma operação Firebase é simulada.
class Timestamp {
  constructor(data) { this.data = new Date(data); }
  toDate() { return new Date(this.data); }
  static fromDate(data) { return new Timestamp(data); }
}
function carregar(arquivo) {
  const codigo = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const modulo = { exports: {} };
  const importar = nome => nome === '@react-native-firebase/firestore' ? { Timestamp }
    : carregar(path.resolve(path.dirname(arquivo), nome + '.ts'));
  vm.runInThisContext('(function(require,module,exports){' + codigo + '\n})')(importar, modulo, modulo.exports);
  return modulo.exports;
}
const auth = carregar('src/utils/auth.ts');
const converters = carregar('src/services/firebase/converters/onboarding.ts');
const datas = carregar('src/services/firebase/converters/datas.ts');
const { resolverSessao } = carregar('src/session/resolverSessao.ts');
const conta = { uid: 'usuario_a', email: 'a@example.test' };
const perfil = { id: conta.uid, email: conta.email, estabelecimentoId: 'est_a' };

test('credenciais rejeitam vazios e formato inválido sem alterar a senha', () => {
  assert.ok(auth.validarCredenciais('   ', 'senha'));
  assert.ok(auth.validarCredenciais('a@', 'senha'));
  assert.ok(auth.validarCredenciais('a@example.test', ''));
  assert.equal(auth.validarCredenciais('  a@example.test  ', ' senha '), null);
});
test('cadastro exige mínimo, confirmação e igualdade das senhas', () => {
  for (const [senha, confirmacao] of [['12345', '12345'], ['123456', ''], ['123456', '123457']]) {
    assert.ok(auth.validarCadastro(conta.email, senha, confirmacao));
  }
  assert.equal(auth.validarCadastro(conta.email, '123456', '123456'), null);
});
test('nome considera trim e limite de armazenamento', () => {
  for (const nome of ['', ' \t\n', '\uFEFF', 'a'.repeat(121)]) assert.ok(auth.validarNomeEstabelecimento(nome));
  assert.equal(auth.validarNomeEstabelecimento('  Mercado  '), null);
  assert.equal(auth.validarNomeEstabelecimento('a'.repeat(120)), null);
});
test('erros de credenciais não revelam existência de conta', () => {
  for (const code of ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential']) {
    assert.equal(auth.mensagemErroFirebase({ code }), 'E-mail ou senha inválidos.');
  }
});
test('erros comuns e desconhecidos nunca mostram código ou mensagem interna', () => {
  for (const code of ['auth/email-already-in-use', 'auth/network-request-failed', 'auth/weak-password',
    'auth/too-many-requests', 'firestore/permission-denied', 'app/web-unavailable', 'interno']) {
    const mensagem = auth.mensagemErroFirebase({ code, message: 'Dado sensível' });
    assert.ok(mensagem);
    assert.ok(!mensagem.includes(code));
    assert.ok(!mensagem.includes('Dado sensível'));
  }
  assert.equal(auth.mensagemErroFirebase(null), auth.mensagemErroFirebase(new Error('Segredo')));
});
test('perfil válido é vinculado à identidade autenticada', () => {
  assert.deepEqual(converters.converterPerfil(perfil, conta), perfil);
});
test('perfil inválido, outro UID/e-mail, vínculo inválido e campos extras são rejeitados', () => {
  for (const invalido of [null, {}, { ...perfil, id: 'outro' }, { ...perfil, email: 'outro@example.test' },
    { ...perfil, estabelecimentoId: '' }, { ...perfil, estabelecimentoId: 'est/a' },
    { ...perfil, estabelecimentoId: 'a'.repeat(129) }, { ...perfil, papel: 'admin' }]) {
    assert.throws(() => converters.converterPerfil(invalido, conta));
  }
});
test('estabelecimento converte Timestamp para Date no domínio', () => {
  const data = new Date('2026-10-03T12:00:00.123Z');
  const documento = { id: 'est_a', nome: 'Mercado', criadoPor: conta.uid, criadoEm: new Timestamp(data) };
  assert.deepEqual(converters.converterEstabelecimento(documento, 'est_a', conta.uid), { ...documento, criadoEm: data });
});
test('estabelecimento ausente, inválido, alheio ou com data não confirmada é rejeitado', () => {
  const e = { id: 'est_a', nome: 'Mercado', criadoPor: conta.uid, criadoEm: new Timestamp(new Date()) };
  for (const invalido of [null, {}, { ...e, id: 'outro' }, { ...e, nome: '   ' }, { ...e, nome: ' Mercado ' },
    { ...e, criadoPor: 'outro' }, { ...e, criadoEm: null }, { ...e, extra: true }]) {
    assert.throws(() => converters.converterEstabelecimento(invalido, 'est_a', conta.uid));
  }
});
test('datas preservam o instante e recusam Date inválida', () => {
  const data = new Date('2026-10-03T12:00:00.123Z');
  assert.deepEqual(datas.timestampParaDate(datas.dateParaTimestamp(data)), data);
  assert.throws(() => datas.dateParaTimestamp(new Date(NaN)));
});

test('sessão não autenticada não consulta perfil', async () => {
  assert.deepEqual(await resolverSessao(null, async () => { throw new Error('Não deve ser consultado'); }), { status: 'unauthenticated' });
});
test('Auth sem perfil permanece recuperável e não entra no estoque', async () => {
  assert.deepEqual(await resolverSessao(conta, async () => null), { status: 'authenticatedWithoutProfile', conta });
});
test('sessão pronta exige perfil e estabelecimento carregados', async () => {
  const estabelecimento = { id: perfil.estabelecimentoId, nome: 'Mercado', criadoPor: conta.uid, criadoEm: new Date() };
  assert.deepEqual(await resolverSessao(conta, async () => ({ perfil, estabelecimento })), {
    status: 'authenticatedReady', conta, perfil, estabelecimento,
  });
});
test('falha de perfil bloqueia sessão e traduz erro', async () => {
  assert.deepEqual(await resolverSessao(conta, async () => { throw { code: 'firestore/unavailable' }; }), {
    status: 'error', mensagem: 'Verifique sua conexão e tente novamente.',
  });
});
