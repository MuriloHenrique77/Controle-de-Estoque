const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const m = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/navigation/dadosDeRota.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInThisContext('(function(module,exports){' + code + '\n})')(m, m.exports);
test('parâmetros preservam dados dos formulários e sobrevivem ao roundtrip JSON sem Date', () => {
  for (const dados of [
    { id: 's', estabelecimentoId: 'e', nome: 'Setor', descricao: 'Descrição' },
    { id: 'p', setorId: 's', quantidadeInicial: 10, estoqueMinimo: 12, estoqueAtual: 11 },
    { id: 'm', produtoId: 'p', tipo: 'saida', quantidade: 4, observacao: 'Retirada', criadoPor: 'u' },
  ]) {
    const original = { ...dados, criadoEm: new Date(), atualizadoEm: new Date() };
    const rota = m.exports.dadosDeRota(original);
    assert.deepEqual(rota, dados);
    assert.deepEqual(JSON.parse(JSON.stringify(rota)), dados);
    assert.ok(original.criadoEm instanceof Date);
  }
});
