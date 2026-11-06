const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
class Timestamp {
  constructor(data) { this.data = new Date(data); }
  toDate() { return new Date(this.data); }
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
const { normalizarDadosSetor, ordenarSetores } = carregar('src/utils/setores.ts');
const { converterSetor } = carregar('src/services/firebase/converters/setor.ts');
const data = new Date('2026-10-03T12:00:00.123Z');
const base = { id: 'set_a', estabelecimentoId: 'est_a', nome: 'Almoxarifado', criadoEm: new Timestamp(data) };

test('normalização aplica trim e omite descrição vazia consistentemente', () => {
  assert.deepEqual(normalizarDadosSetor({ nome: '  Setor  ', descricao: ' \n ' }), { nome: 'Setor' });
  assert.deepEqual(normalizarDadosSetor({ nome: 'Setor', descricao: ' Texto\ncom linhas ' }), { nome: 'Setor', descricao: 'Texto\ncom linhas' });
});
test('nome obrigatório e limites de nome/descrição são validados', () => {
  for (const nome of ['', ' \t\n', '\uFEFF', 'a'.repeat(121)]) assert.throws(() => normalizarDadosSetor({ nome }));
  assert.throws(() => normalizarDadosSetor({ nome: 'Setor', descricao: 'a'.repeat(2001) }));
  assert.equal(normalizarDadosSetor({ nome: 'a'.repeat(120), descricao: 'a'.repeat(2000) }).descricao.length, 2000);
});
test('ordenação alfabética pt-BR é determinística e não altera a entrada', () => {
  const setores = [{ id: 'b', nome: 'Zulu' }, { id: 'c', nome: 'Água' }, { id: 'a', nome: 'água' }];
  assert.deepEqual(ordenarSetores(setores).map(s => s.id), ['a', 'c', 'b']);
  assert.deepEqual(setores.map(s => s.id), ['b', 'c', 'a']);
});
test('converter produz o único contrato definitivo com Date', () => {
  const setor = converterSetor({ ...base, descricao: 'Texto', atualizadoEm: new Timestamp(data) }, 'set_a', 'est_a');
  assert.deepEqual(setor, { ...base, descricao: 'Texto', criadoEm: data, atualizadoEm: data });
});
test('converter rejeita outro estabelecimento, outro ID, campos e tipos inválidos', () => {
  for (const dados of [null, {}, { ...base, id: 'outro' }, { ...base, estabelecimentoId: 'est_b' },
    { ...base, nome: '' }, { ...base, descricao: 5 }, { ...base, criadoEm: 'ontem' }, { ...base, extra: true }]) {
    assert.throws(() => converterSetor(dados, 'set_a', 'est_a'));
  }
});
test('somente timestamp nulo explicitamente pendente admite estimativa temporária', () => {
  assert.throws(() => converterSetor({ ...base, criadoEm: null }, 'set_a', 'est_a'));
  assert.throws(() => converterSetor({ ...base, criadoEm: undefined }, 'set_a', 'est_a', true));
  const setor = converterSetor({ ...base, criadoEm: null, atualizadoEm: null }, 'set_a', 'est_a', true, data);
  assert.deepEqual(setor.criadoEm, data);
  assert.deepEqual(setor.atualizadoEm, data);
});
