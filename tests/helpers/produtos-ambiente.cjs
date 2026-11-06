const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
class Timestamp { constructor(date) { this.date = new Date(date); } toDate() { return new Date(this.date); } }
function ambiente() {
  const docs = new Map();
  const commits = [];
  const consultas = [];
  const auth = { currentUser: { uid: 'a' } };
  const falhas = { offline: false, reavaliar: null };
  let sequence = 0;
  const agora = new Timestamp('2026-10-04T12:00:00Z');
  const ref = (collection, id) => ({ path: `${collection}/${id}`, id });
  const snapshot = r => ({ id: r.id, exists: () => docs.has(r.path), data: () => docs.get(r.path) });
  const sdk = {
    Timestamp,
    collection: (_db, name) => ({ name }),
    doc: (dbOrCollection, name, id) => id !== undefined ? ref(name, id) : ref(dbOrCollection.name, `p${++sequence}`),
    query: (collection, ...filters) => ({ collection, filters }),
    where: (field, operator, value) => ({ field, operator, value }), limit: size => ({ size }),
    serverTimestamp: () => agora, deleteField: () => 'DELETE', increment: value => ({ increment: value }),
    getDocsFromServer: async q => {
      consultas.push(q);
      const resultado = [...docs].filter(([p,d]) => p.startsWith(q.collection.name + '/') && q.filters.every(f => !f.field || d[f.field] === f.value))
        .map(([p]) => snapshot(ref(q.collection.name, p.split('/')[1])));
      const size = q.filters.find(f => f.size)?.size;
      const lista = size ? resultado.slice(0, size) : resultado;
      return { docs: lista, empty: lista.length === 0 };
    },
    writeBatch: () => batch(),
    runTransaction: async (_db, fn) => {
      if (falhas.offline) throw Object.assign(new Error('Servidor indisponível'),{code:'firestore/unavailable'});
      let b = batch(); b.get = async r => snapshot(r); await fn(b);
      if (falhas.reavaliar) { const mudar=falhas.reavaliar; falhas.reavaliar=null; mudar(); b=batch(); b.get=async r=>snapshot(r); await fn(b); }
      await b.commit();
    },
    updateDoc: async (r,d) => { const b = batch(); b.update(r,d); await b.commit(); },
    onSnapshot: (q,_options,receive) => {
      consultas.push(q);
      const ds = [...docs].filter(([p,d]) => p.startsWith(q.collection.name + '/') && q.filters.every(f => d[f.field] === f.value))
        .map(([p,d]) => ({ id:p.split('/')[1], data:()=>d, metadata:{hasPendingWrites:false} }));
      receive({docs:ds}); return () => {};
    },
  };
  function batch() {
    const writes = [];
    return {
      set: (r,d) => writes.push({type:'set',r,d}), update: (r,d) => writes.push({type:'update',r,d}), delete: r => writes.push({type:'delete',r}),
      commit: async () => {
        const next = new Map(docs);
        for (const w of writes) {
          if (w.type === 'delete') { next.delete(w.r.path); continue; }
          if (w.type === 'update' && !next.has(w.r.path)) throw new Error('Documento ausente');
          const result = w.type === 'set' ? {...w.d} : {...next.get(w.r.path)};
          for (const [k,v] of Object.entries(w.d)) {
            if (v === 'DELETE') delete result[k];
            else if (v && typeof v === 'object' && 'increment' in v) result[k] = (result[k] ?? 0) + v.increment;
            else result[k] = v;
          }
          next.set(w.r.path,result);
        }
        docs.clear(); for (const [k,v] of next) docs.set(k,v); commits.push(writes);
      },
    };
  }
  const cache = new Map();
  function carregar(arquivo) {
    arquivo = path.resolve(arquivo);
    if (cache.has(arquivo)) return cache.get(arquivo);
    const codigo = ts.transpileModule(fs.readFileSync(arquivo,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    const modulo = {exports:{}};
    const importar = nome => {
      if (nome === '@react-native-firebase/firestore') return sdk;
      if (nome.endsWith('/firebase/auth')) return {obterAuth:()=>auth};
      if (nome.endsWith('/firebase/firestore')) return {obterFirestore:()=>({})};
      return carregar(path.resolve(path.dirname(arquivo),nome+'.ts'));
    };
    vm.runInThisContext('(function(require,module,exports){'+codigo+'\n})')(importar,modulo,modulo.exports);
    cache.set(arquivo,modulo.exports); return modulo.exports;
  }
  docs.set('setores/s1',{id:'s1',estabelecimentoId:'est_a',nome:'Setor',criadoEm:agora});
  return {docs,commits,consultas,auth,agora,falhas, carregar, movimentos:carregar('src/services/movimentacoes/movimentacoesService.ts'), produtos:carregar('src/services/produtos/produtosService.ts'), setores:carregar('src/services/setores/setoresService.ts')};
}
const contexto = {uid:'a',estabelecimentoId:'est_a'};

module.exports={ambiente,contexto};
