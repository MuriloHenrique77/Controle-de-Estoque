const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');

// Somente emuladores locais e projeto demo: jamais utilizar URLs de produção.
const projectId = 'demo-estoque-local';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
assert.match(firestoreHost || '', /^(127\.0\.0\.1|localhost):\d+$/);
assert.match(authHost || '', /^(127\.0\.0\.1|localhost):\d+$/);
const database = `projects/${projectId}/databases/(default)`;
const root = `http://${firestoreHost}/v1/${database}/documents`;
const string = (value) => ({ stringValue: value });

async function request(method, path, token, body) {
  const response = await fetch(`${root}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}

async function signup() {
  const email = `rules-${randomUUID()}@example.test`;
  const response = await fetch(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Emulator-Test-123!', returnSecureToken: true }),
    },
  );
  assert.equal(response.status, 200);
  const { localId: uid, idToken: token } = await response.json();
  assert.equal(typeof token, 'string');
  return { uid, email, token };
}

function onboarding(user, id = randomUUID()) {
  return [
    {
      update: {
        name: `${database}/documents/estabelecimentos/${id}`,
        fields: { id: string(id), nome: string('Estoque de teste'), criadoPor: string(user.uid) },
      },
      updateTransforms: [{ fieldPath: 'criadoEm', setToServerValue: 'REQUEST_TIME' }],
    },
    {
      update: {
        name: `${database}/documents/usuarios/${user.uid}`,
        fields: {
          id: string(user.uid), email: string(user.email), estabelecimentoId: string(id),
        },
      },
    },
  ];
}

function denied(result) {
  assert.equal(result.status, 403, JSON.stringify(result.data));
  assert.equal(result.data.error.status, 'PERMISSION_DENIED');
}

test('Etapa 9: volume de 400 movimentos no Emulator, consultas completas e agregação',async t=>{
 const user=await signup(),est=randomUUID(),sector=randomUUID(),prefix=randomUUID();
 assert.equal((await request('POST',':commit',user.token,{writes:onboarding(user,est)})).status,200);
 const path=(c,id)=>`${database}/documents/${c}/${id}`,integer=n=>({integerValue:String(n)}),stamp={timestampValue:'2026-10-05T12:00:00Z'};
 const writes=[{update:{name:path('setores',sector),fields:{id:string(sector),estabelecimentoId:string(est),nome:string('Volume'),criadoEm:stamp}}}];
 for(let p=0;p<20;p++)writes.push({update:{name:path('produtos',prefix+'_'+p),fields:{id:string(prefix+'_'+p),estabelecimentoId:string(est),setorId:string(sector),nome:string('Produto '+p),quantidadeInicial:integer(0),estoqueAtual:integer(10),criadoEm:stamp}}});
 for(let i=0;i<400;i++){const entrada=i%2===0;writes.push({update:{name:path('movimentacoes',prefix+'_'+i),fields:{id:string(prefix+'_'+i),estabelecimentoId:string(est),setorId:string(sector),produtoId:string(prefix+'_'+Math.floor(i/20)),tipo:string(entrada?'entrada':'saida'),quantidade:integer(entrada?2:1),criadoPor:string(user.uid),criadoEm:stamp,...(i%4===3?{vendedorNome:string('Volume Carlos')}:{})}}});}
 assert.equal((await request('POST',':commit','owner',{writes})).status,200);
 const start=performance.now(),dados={emCache:false};
 for(const [col,field] of [['produtos','produtos'],['setores','setores'],['movimentacoes','movimentos']]){
  const filters=[{fieldFilter:{field:{fieldPath:'estabelecimentoId'},op:'EQUAL',value:string(est)}}];
  if(col==='movimentacoes')for(const [op,time]of [['GREATER_THAN_OR_EQUAL','2026-10-01T00:00:00Z'],['LESS_THAN','2026-11-01T00:00:00Z']])filters.push({fieldFilter:{field:{fieldPath:'criadoEm'},op,value:{timestampValue:time}}});
  const result=await request('POST',':runQuery',user.token,{structuredQuery:{from:[{collectionId:col}],where:filters.length===1?filters[0]:{compositeFilter:{op:'AND',filters}},...(col==='movimentacoes'?{orderBy:[{field:{fieldPath:'criadoEm'},direction:'DESCENDING'}]}:{})}});
  assert.equal(result.status,200);dados[field]=result.data.filter(r=>r.document).map(r=>Object.fromEntries(Object.entries(r.document.fields).map(([k,v])=>[k,v.stringValue??(v.integerValue!==undefined?Number(v.integerValue):new Date(v.timestampValue))])));
 }
 const fs=require('node:fs'),vm=require('node:vm'),pathModule=require('node:path'),ts=require('typescript'),cache=new Map();
 function load(file){file=pathModule.resolve(file);if(cache.has(file))return cache.get(file);const m={exports:{}},code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(n=>load(pathModule.resolve(pathModule.dirname(file),n+'.ts')),m,m.exports);cache.set(file,m.exports);return m.exports;}
 const aggregateStart=performance.now();const result=load('src/utils/relatorios.ts').agregarRelatorio(est,dados,{inicio:new Date('2026-10-01T00:00:00Z'),fimExclusivo:new Date('2026-11-01T00:00:00Z')});
 assert.equal(result.movimentos.length,400);assert.equal(dados.movimentos.filter(m=>m.vendedorNome).length,100);assert.deepEqual(result.resumo,{totalEntradas:400,totalSaidas:200,saldoPeriodo:200,quantidadeMovimentacoes:400,produtosMovimentados:20});assert.equal(result.maioresEntradas.length,20);assert.equal(result.maioresSaidas.length,20);
 t.diagnostic('Volume completo: 400 movimentos/20 produtos; leitura '+Math.round(aggregateStart-start)+'ms; transpile+agregação '+Math.round(performance.now()-aggregateStart)+'ms. Tempo local indicativo, sem SLA.');
});

test('Etapa 8: consultas reais dos relatórios, isolamento e limites do último dia', async (t) => {
  const a=await signup(), b=await signup(), pending=await signup(), ea=randomUUID(), eb=randomUUID();
  for(const [u,e] of [[a,ea],[b,eb]])assert.equal((await request('POST',':commit',u.token,{writes:onboarding(u,e)})).status,200);
  const inicio='2026-10-05T03:00:00Z', fim='2026-10-06T03:00:00Z';
  const writes=[];
  for(const [e,p] of [[ea,'a'],[eb,'b']]) {
    for(const col of ['produtos','setores'])writes.push({update:{name:`${database}/documents/${col}/rel8_${p}`,fields:{id:string(`rel8_${p}`),estabelecimentoId:string(e)}}});
    for(const [i,date] of ['2026-10-05T02:59:59.999999Z',inicio,'2026-10-06T02:59:59.999999Z',fim].entries())writes.push({update:{name:`${database}/documents/movimentacoes/rel8_${p}_${i}`,fields:{estabelecimentoId:string(e),produtoId:string(`rel8_${p}`),setorId:string(`rel8_${p}`),criadoEm:{timestampValue:date}}}});
  }
  assert.equal((await request('POST',':commit','owner',{writes})).status,200);
  function consulta(col,e,extras=[],scoped=true) {
    const filters=[...(scoped?[{fieldFilter:{field:{fieldPath:'estabelecimentoId'},op:'EQUAL',value:string(e)}}]:[]),...extras];
    if(col==='movimentacoes')filters.push(...[['GREATER_THAN_OR_EQUAL',inicio],['LESS_THAN',fim]].map(([op,date])=>({fieldFilter:{field:{fieldPath:'criadoEm'},op,value:{timestampValue:date}}})));
    return {structuredQuery:{from:[{collectionId:col}],where:filters.length===1?filters[0]:{compositeFilter:{op:'AND',filters}},...(col==='movimentacoes'?{orderBy:[{field:{fieldPath:'criadoEm'},direction:'DESCENDING'}]}:{})}};
  }
  for(const col of ['produtos','setores','movimentacoes']) {
    for(const [label,u,e] of [['A',a,ea],['B',b,eb]])await t.test(`${label} consulta ${col} próprios`,async()=>{const r=await request('POST',':runQuery',u.token,consulta(col,e));assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.filter(x=>x.document).length,col==='movimentacoes'?2:1);if(col==='movimentacoes')assert.deepEqual(r.data.filter(x=>x.document).map(x=>x.document.name.split('/').at(-1)),[`rel8_${label.toLowerCase()}_2`,`rel8_${label.toLowerCase()}_1`]);});
    for(const [label,token,e] of [['A consulta B',a.token,eb],['B consulta A',b.token,ea],['anônimo',undefined,ea],['sem perfil',pending.token,ea]])await t.test(`${label}: ${col} negado`,async()=>denied(await request('POST',':runQuery',token,consulta(col,e))));
    await t.test(`${col}: query sem escopo negada`,async()=>{const q=col==='movimentacoes'?consulta(col,ea,[],false):{structuredQuery:{from:[{collectionId:col}]}};denied(await request('POST',':runQuery',a.token,q));});
  }
  for(const field of ['produtoId','setorId']) {
    const extra=[{fieldFilter:{field:{fieldPath:field},op:'EQUAL',value:string('rel8_b')}}];
    await t.test(`ID de B em ${field} não autoriza consultar estabelecimento B`,async()=>denied(await request('POST',':runQuery',a.token,consulta('movimentacoes',eb,extra))));
    await t.test(`filtro ${field} não substitui isolamento obrigatório`,async()=>denied(await request('POST',':runQuery',a.token,consulta('movimentacoes',ea,extra,false))));
    await t.test(`escopo A com ${field} de B não retorna dados B`,async()=>{const r=await request('POST',':runQuery',a.token,consulta('movimentacoes',ea,extra));assert.equal(r.status,200);assert.equal(r.data.filter(x=>x.document).length,0);});
  }
});

test('Etapas 4 e 5: onboarding, setores, isolamento e ataques às Rules', async (t) => {
  const alice = await signup();
  const bob = await signup();
  const pending = await signup();
  const aliceId = randomUUID();
  const bobId = randomUUID();
  const missing = await request('GET', `/usuarios/${pending.uid}`, pending.token);
  await t.test('próprio perfil ausente pode ser consultado', () => assert.equal(missing.status, 404));

  for (const [label, path] of [
    ['perfil', `/usuarios/${alice.uid}`], ['estabelecimento', `/estabelecimentos/${aliceId}`],
  ]) {
    await t.test(`anônimo não lê ${label}`, async () => denied(await request('GET', path)));
    await t.test(`anônimo não lista ${label}`, async () => denied(await request('GET', path.split('/').slice(0, 2).join('/'))));
  }
  const anonymousWrites = onboarding(alice, aliceId);
  await t.test('anônimo não cria perfil', async () => denied(await request('POST', ':commit', undefined, { writes: [anonymousWrites[1]] })));
  await t.test('anônimo não cria estabelecimento', async () => denied(await request('POST', ':commit', undefined, { writes: [anonymousWrites[0]] })));
  await t.test('anônimo não faz batch onboarding', async () => denied(await request('POST', ':commit', undefined, { writes: anonymousWrites })));

  await t.test('usuário sem perfil não cria estabelecimento solto', async () => denied(await request('POST', ':commit', pending.token, { writes: [onboarding(pending)[0]] })));
  await t.test('usuário sem perfil não aponta perfil a estabelecimento arbitrário', async () => denied(await request('POST', ':commit', pending.token, { writes: [onboarding(pending)[1]] })));

  for (const [label, mutate] of [
    ['UID de terceiro no path', (w) => { w[1].update.name = `${database}/documents/usuarios/${alice.uid}`; }],
    ['UID de terceiro no campo id', (w) => { w[1].update.fields.id = string(alice.uid); }],
    ['e-mail de terceiro', (w) => { w[1].update.fields.email = string(alice.email); }],
    ['e-mail numérico', (w) => { w[1].update.fields.email = { integerValue: '42' }; }],
    ['e-mail excessivo', (w) => { w[1].update.fields.email = string('a'.repeat(255)); }],
    ['perfil sem e-mail', (w) => { delete w[1].update.fields.email; }],
    ['perfil com papel admin extra', (w) => { w[1].update.fields.papel = string('admin'); }],
    ['estabelecimentoId numérico', (w) => { w[1].update.fields.estabelecimentoId = { integerValue: '1' }; }],
    ['estabelecimentoId excessivo', (w) => { w[1].update.fields.estabelecimentoId = string('a'.repeat(129)); }],
    ['estabelecimentoId com barra', (w) => { w[1].update.fields.estabelecimentoId = string('outro/id'); }],
    ['estabelecimentoId divergente', (w) => { w[1].update.fields.estabelecimentoId = string(randomUUID()); }],
    ['id do estabelecimento divergente', (w) => { w[0].update.fields.id = string(randomUUID()); }],
    ['criador de terceiro', (w) => { w[0].update.fields.criadoPor = string(alice.uid); }],
    ['criador numérico', (w) => { w[0].update.fields.criadoPor = { integerValue: '1' }; }],
    ['nome vazio', (w) => { w[0].update.fields.nome = string(''); }],
    ['nome só espaços', (w) => { w[0].update.fields.nome = string('   '); }],
    ['nome com espaço no início', (w) => { w[0].update.fields.nome = string(' Estoque'); }],
    ['nome com espaço no fim', (w) => { w[0].update.fields.nome = string('Estoque '); }],
    ['nome com tabulação na extremidade', (w) => { w[0].update.fields.nome = string('\tEstoque'); }],
    ['nome com espaço Unicode na extremidade', (w) => { w[0].update.fields.nome = string('\u00a0Estoque'); }],
    ['nome com BOM na extremidade', (w) => { w[0].update.fields.nome = string('Estoque\ufeff'); }],
    ['nome excessivo', (w) => { w[0].update.fields.nome = string('a'.repeat(121)); }],
    ['nome numérico', (w) => { w[0].update.fields.nome = { integerValue: '42' }; }],
    ['estabelecimento sem nome', (w) => { delete w[0].update.fields.nome; }],
    ['estabelecimento com campo inesperado', (w) => { w[0].update.fields.extra = string('não permitido'); }],
    ['timestamp antigo', (w) => { delete w[0].updateTransforms; w[0].update.fields.criadoEm = { timestampValue: '2000-01-01T00:00:00Z' }; }],
    ['timestamp futuro', (w) => { delete w[0].updateTransforms; w[0].update.fields.criadoEm = { timestampValue: '2100-01-01T00:00:00Z' }; }],
    ['timestamp como texto', (w) => { delete w[0].updateTransforms; w[0].update.fields.criadoEm = string('hoje'); }],
    ['timestamp ausente', (w) => { delete w[0].updateTransforms; }],
  ]) {
    await t.test(`nega batch inválido: ${label}`, async () => {
      const writes = onboarding(pending);
      mutate(writes);
      denied(await request('POST', ':commit', pending.token, { writes }));
      const result = await request('GET', `/usuarios/${pending.uid}`, pending.token);
      assert.equal(result.status, 404, 'batch negado não pode deixar metade do onboarding');
    });
  }
  await t.test('nega dois estabelecimentos no mesmo batch', async () => {
    const writes = onboarding(pending);
    writes.push(onboarding(pending)[0]);
    denied(await request('POST', ':commit', pending.token, { writes }));
  });
  await t.test('nega perfil para estabelecimento preexistente até do próprio criador', async () => {
    const writes = onboarding(pending);
    // owner é bypass exclusivo do emulador para preparar um dado órfão inválido.
    assert.equal((await request('POST', ':commit', 'owner', { writes: [writes[0]] })).status, 200);
    denied(await request('POST', ':commit', pending.token, { writes: [writes[1]] }));
  });

  for (const [label, user, id] of [['A', alice, aliceId], ['B', bob, bobId]]) {
    await t.test(`batch legítimo cria perfil e estabelecimento ${label}`, async () => {
      const result = await request('POST', ':commit', user.token, { writes: onboarding(user, id) });
      assert.equal(result.status, 200, JSON.stringify(result.data));
      assert.equal(result.data.writeResults.length, 2);
    });
    await t.test(`usuário ${label} lê próprio perfil`, async () => assert.equal((await request('GET', `/usuarios/${user.uid}`, user.token)).status, 200));
    await t.test(`usuário ${label} lê próprio estabelecimento`, async () => assert.equal((await request('GET', `/estabelecimentos/${id}`, user.token)).status, 200));
  }
  for (const [label, user, other, otherId, id] of [
    ['A', alice, bob, bobId, aliceId], ['B', bob, alice, aliceId, bobId],
  ]) {
    await t.test(`usuário ${label} não lê perfil do outro`, async () => denied(await request('GET', `/usuarios/${other.uid}`, user.token)));
    await t.test(`usuário ${label} não lê estabelecimento do outro`, async () => denied(await request('GET', `/estabelecimentos/${otherId}`, user.token)));
    await t.test(`usuário ${label} não faz novo onboarding`, async () => denied(await request('POST', ':commit', user.token, { writes: onboarding(user) })));
    await t.test(`usuário ${label} não cria segundo estabelecimento isolado`, async () => denied(await request('POST', ':commit', user.token, { writes: [onboarding(user)[0]] })));
    for (const collection of ['usuarios', 'estabelecimentos']) {
      const ownPath = `/${collection}/${collection === 'usuarios' ? user.uid : id}`;
      await t.test(`usuário ${label} não lista ${collection}`, async () => denied(await request('GET', `/${collection}`, user.token)));
      await t.test(`usuário ${label} não exclui ${collection}`, async () => denied(await request('DELETE', ownPath, user.token)));
      await t.test(`usuário ${label} não atualiza ${collection}`, async () => denied(await request('PATCH', ownPath, user.token, { fields: { id: string('outra-identidade') } })));
    }
    await t.test(`usuário ${label} não altera estabelecimentoId`, async () => denied(await request('PATCH', `/usuarios/${user.uid}`, user.token, {
      fields: { id: string(user.uid), email: string(user.email), estabelecimentoId: string(otherId) },
    })));
    await t.test(`usuário ${label} não modifica estabelecimento alheio`, async () => denied(await request('PATCH', `/estabelecimentos/${otherId}`, user.token, { fields: { nome: string('Ataque') } })));
  }
  await t.test('pendente não vincula perfil a estabelecimento de outro', async () => {
    const writes = onboarding(pending, aliceId);
    denied(await request('POST', ':commit', pending.token, { writes: [writes[1]] }));
    denied(await request('POST', ':commit', pending.token, { writes }));
  });

  // Escritas REST com transforms equivalem ao serverTimestamp do SDK nativo.
  function sectorWrite(id, establishmentId, changes = {}) {
    return {
      update: {
        name: `${database}/documents/setores/${id}`,
        fields: { id: string(id), estabelecimentoId: string(establishmentId), nome: string('Setor de teste'), ...changes },
      },
      updateTransforms: ['criadoEm', 'atualizadoEm'].map((fieldPath) => ({ fieldPath, setToServerValue: 'REQUEST_TIME' })),
      currentDocument: { exists: false },
    };
  }
  const commitSector = (write, token) => request('POST', ':commit', token, { writes: [write] });
  function sectorQuery(establishmentId) {
    return { structuredQuery: {
      from: [{ collectionId: 'setores' }],
      ...(establishmentId ? { where: { fieldFilter: {
        field: { fieldPath: 'estabelecimentoId' }, op: 'EQUAL', value: string(establishmentId),
      } } } : {}),
    } };
  }
  const aSectorId = randomUUID();
  const bSectorId = randomUUID();
  for (const [label, user, ownEst, ownId] of [
    ['A', alice, aliceId, aSectorId], ['B', bob, bobId, bSectorId],
  ]) {
    await t.test(`${label}: cria setor com timestamps do servidor`, async () => {
      const result = await commitSector(sectorWrite(ownId, ownEst), user.token);
      assert.equal(result.status, 200, JSON.stringify(result.data));
    });
  }
  for (const [label, token] of [['anônimo', undefined], ['sem perfil', pending.token]]) {
    for (const operation of ['get', 'list', 'query', 'create', 'update', 'delete']) {
      await t.test(`${label}: setores nega ${operation}`, async () => {
        const result = operation === 'get' ? await request('GET', `/setores/${aSectorId}`, token)
          : operation === 'list' ? await request('GET', '/setores', token)
          : operation === 'query' ? await request('POST', ':runQuery', token, sectorQuery(aliceId))
          : operation === 'create' ? await commitSector(sectorWrite(randomUUID(), aliceId), token)
          : operation === 'update' ? await request('PATCH', `/setores/${aSectorId}`, token, { fields: { nome: string('Ataque') } })
          : await request('DELETE', `/setores/${aSectorId}`, token);
        denied(result);
      });
    }
  }
  for (const [label, user, ownEst, ownId, otherEst, otherId] of [
    ['A', alice, aliceId, aSectorId, bobId, bSectorId],
    ['B', bob, bobId, bSectorId, aliceId, aSectorId],
  ]) {
    await t.test(`${label}: lê seu setor`, async () => assert.equal((await request('GET', `/setores/${ownId}`, user.token)).status, 200));
    await t.test(`${label}: consulta segura só retorna seu estabelecimento`, async () => {
      const result = await request('POST', ':runQuery', user.token, sectorQuery(ownEst));
      assert.equal(result.status, 200, JSON.stringify(result.data));
      const documents = result.data.filter((item) => item.document).map((item) => item.document);
      assert.equal(documents.length, 1);
      assert.equal(documents[0].fields.estabelecimentoId.stringValue, ownEst);
    });
    await t.test(`${label}: query sem filtro não usa Rules como filtro`, async () => denied(await request('POST', ':runQuery', user.token, sectorQuery())));
    await t.test(`${label}: list global negada`, async () => denied(await request('GET', '/setores', user.token)));
    await t.test(`${label}: query de outro estabelecimento negada`, async () => denied(await request('POST', ':runQuery', user.token, sectorQuery(otherEst))));
    await t.test(`${label}: não lê setor alheio`, async () => denied(await request('GET', `/setores/${otherId}`, user.token)));
    await t.test(`${label}: não cria setor alheio`, async () => denied(await commitSector(sectorWrite(randomUUID(), otherEst), user.token)));
    await t.test(`${label}: não altera setor alheio`, async () => denied(await request('PATCH', `/setores/${otherId}`, user.token, { fields: { nome: string('Ataque') } })));
    await t.test(`${label}: não exclui setor alheio`, async () => denied(await request('DELETE', `/setores/${otherId}`, user.token)));
    const original = (await request('GET', `/setores/${ownId}`, user.token)).data.fields;
    function updateWrite(fields) {
      return {
        update: { name: `${database}/documents/setores/${ownId}`, fields },
        updateTransforms: [{ fieldPath: 'atualizadoEm', setToServerValue: 'REQUEST_TIME' }],
        currentDocument: { exists: true },
      };
    }
    for (const [attack, mutate] of [
      ['troca id', (f) => { f.id = string(randomUUID()); }],
      ['troca estabelecimento', (f) => { f.estabelecimentoId = string(otherEst); }],
      ['troca criadoEm', (f) => { f.criadoEm = { timestampValue: '2000-01-01T00:00:00Z' }; }],
      ['campo extra', (f) => { f.papel = string('admin'); }],
      ['remove nome', (f) => { delete f.nome; }],
      ['remove criadoEm', (f) => { delete f.criadoEm; }],
      ['nome vazio', (f) => { f.nome = string(''); }],
      ['nome espaços', (f) => { f.nome = string('   '); }],
      ['nome não normalizado', (f) => { f.nome = string(' Setor '); }],
      ['nome Unicode', (f) => { f.nome = string('\u00a0Setor'); }],
      ['nome BOM', (f) => { f.nome = string('Setor\ufeff'); }],
      ['nome longo', (f) => { f.nome = string('a'.repeat(121)); }],
      ['nome numérico', (f) => { f.nome = { integerValue: '42' }; }],
      ['descrição longa', (f) => { f.descricao = string('a'.repeat(2001)); }],
      ['descrição vazia', (f) => { f.descricao = string(''); }],
      ['descrição não normalizada', (f) => { f.descricao = string(' Descrição '); }],
      ['descrição nula', (f) => { f.descricao = { nullValue: null }; }],
      ['id numérico', (f) => { f.id = { integerValue: '1' }; }],
      ['estabelecimento numérico', (f) => { f.estabelecimentoId = { integerValue: '1' }; }],
      ['criadoEm texto', (f) => { f.criadoEm = string('hoje'); }],
    ]) {
      await t.test(`${label}: atualização nega ${attack}`, async () => {
        const fields = structuredClone(original);
        delete fields.atualizadoEm;
        mutate(fields);
        denied(await commitSector(updateWrite(fields), user.token));
      });
    }
    for (const [attack, value] of [['ausente', undefined], ['texto', string('hoje')], ['antigo', { timestampValue: '2000-01-01T00:00:00Z' }]]) {
      await t.test(`${label}: atualizadoEm ${attack} negado`, async () => {
        const fields = { ...original, nome: string('Alterado') };
        if (value) fields.atualizadoEm = value; else delete fields.atualizadoEm;
        const write = updateWrite(fields);
        delete write.updateTransforms;
        denied(await commitSector(write, user.token));
      });
    }
    await t.test(`${label}: atualiza nome e descrição multiline preservando identidade`, async () => {
      const fields = { ...original, nome: string('Novo nome'), descricao: string('Linha um\nLinha dois') };
      delete fields.atualizadoEm;
      const result = await commitSector(updateWrite(fields), user.token);
      assert.equal(result.status, 200, JSON.stringify(result.data));
      const changed = (await request('GET', `/setores/${ownId}`, user.token)).data.fields;
      assert.deepEqual(changed.criadoEm, original.criadoEm);
      assert.deepEqual(changed.id, original.id);
      assert.deepEqual(changed.estabelecimentoId, original.estabelecimentoId);
      delete changed.descricao;
      delete changed.atualizadoEm;
      assert.equal((await commitSector(updateWrite(changed), user.token)).status, 200, 'descrição pode ser removida');
    });
  }
  for (const [label, mutate] of [
    ['id diferente do documento', (w) => { w.update.fields.id = string(randomUUID()); }],
    ['id excessivo', (w) => { w.update.fields.id = string('a'.repeat(129)); }],
    ['id numérico', (w) => { w.update.fields.id = { integerValue: '1' }; }],
    ['estabelecimento numérico', (w) => { w.update.fields.estabelecimentoId = { integerValue: '1' }; }],
    ['campo extra', (w) => { w.update.fields.extra = string('Ataque'); }],
    ['sem nome', (w) => { delete w.update.fields.nome; }],
    ['nome vazio', (w) => { w.update.fields.nome = string(''); }],
    ['nome espaços', (w) => { w.update.fields.nome = string('   '); }],
    ['nome com borda', (w) => { w.update.fields.nome = string(' Setor'); }],
    ['nome excessivo', (w) => { w.update.fields.nome = string('a'.repeat(121)); }],
    ['nome não string', (w) => { w.update.fields.nome = { booleanValue: true }; }],
    ['descrição não string', (w) => { w.update.fields.descricao = { integerValue: '1' }; }],
    ['descrição excessiva', (w) => { w.update.fields.descricao = string('a'.repeat(2001)); }],
    ['descrição vazia', (w) => { w.update.fields.descricao = string(''); }],
    ['criadoEm ausente', (w) => { w.updateTransforms = w.updateTransforms.filter((v) => v.fieldPath !== 'criadoEm'); }],
    ['criadoEm texto', (w) => { w.updateTransforms = w.updateTransforms.filter((v) => v.fieldPath !== 'criadoEm'); w.update.fields.criadoEm = string('hoje'); }],
    ['criadoEm futuro', (w) => { w.updateTransforms = w.updateTransforms.filter((v) => v.fieldPath !== 'criadoEm'); w.update.fields.criadoEm = { timestampValue: '2100-01-01T00:00:00Z' }; }],
    ['atualizadoEm texto', (w) => { w.updateTransforms = w.updateTransforms.filter((v) => v.fieldPath !== 'atualizadoEm'); w.update.fields.atualizadoEm = string('hoje'); }],
  ]) {
    await t.test(`criação setor nega ${label}`, async () => {
      const write = sectorWrite(randomUUID(), aliceId);
      mutate(write);
      denied(await commitSector(write, alice.token));
    });
  }
  await t.test('limites permitidos e atualizadoEm opcional na criação', async () => {
    const id = randomUUID();
    const write = sectorWrite(id, aliceId, { nome: string('a'.repeat(120)), descricao: string('a'.repeat(2000)) });
    write.updateTransforms = write.updateTransforms.filter((v) => v.fieldPath !== 'atualizadoEm');
    assert.equal((await commitSector(write, alice.token)).status, 200);
    assert.equal((await request('DELETE', `/setores/${id}`, alice.token)).status, 200);
  });
  for (const [label, user, id] of [['A', alice, aSectorId], ['B', bob, bSectorId]]) {
    await t.test(`${label}: exclui próprio setor`, async () => assert.equal((await request('DELETE', `/setores/${id}`, user.token)).status, 200));
  }

  for (const path of [
    'produtos', 'movimentacoes',
    `usuarios/${alice.uid}/privado`, `estabelecimentos/${aliceId}/setores`,
    'setores/inexistente/subcolecao',
  ]) {
    for (const [label, token] of [['anônimo', undefined], ['autenticado', alice.token]]) {
      for (const method of ['GET', 'LIST', 'POST', 'PATCH', 'DELETE']) {
        await t.test(`${label}: nega ${method} em ${path}`, async () => {
          const url = method === 'LIST' ? `/${path}` : method === 'POST' ? `/${path}?documentId=teste` : `/${path}/teste`;
          denied(await request(method === 'LIST' ? 'GET' : method, url, token,
            ['POST', 'PATCH'].includes(method) ? { fields: { nome: string('Tentativa') } } : undefined));
        });
      }
    }
  }
});

test('Etapa 6: produtos, estoque inicial atômico, cascade e RN-08', async (t) => {
  const a = await signup();
  const b = await signup();
  const aEst = randomUUID();
  const bEst = randomUUID();
  const aSector = randomUUID();
  const bSector = randomUUID();
  const integer = (value) => ({ integerValue: String(value) });
  const name = (collection, id) => `${database}/documents/${collection}/${id}`;
  const commit = (writes, token = a.token) => request('POST', ':commit', token, { writes });
  const successful = (result) => assert.equal(result.status, 200, JSON.stringify(result.data));
  for (const [user, est, sector] of [[a, aEst, aSector], [b, bEst, bSector]]) {
    successful(await commit(onboarding(user, est), user.token));
    successful(await commit([{
      update: { name: name('setores', sector), fields: { id: string(sector), estabelecimentoId: string(est), nome: string('TESTE Produtos') } },
      updateTransforms: [{ fieldPath: 'criadoEm', setToServerValue: 'REQUEST_TIME' }],
    }], user.token));
  }
  function sectorChange(sector, product, delta) {
    return {
      update: { name: name('setores', sector), fields: { ultimaOperacaoProdutoId: string(product) } },
      updateMask: { fieldPaths: ['ultimaOperacaoProdutoId'] },
      updateTransforms: [
        { fieldPath: 'quantidadeProdutos', increment: integer(delta) },
        { fieldPath: 'atualizadoEm', setToServerValue: 'REQUEST_TIME' },
      ],
    };
  }
  function productWrites(id, quantity, user = a, est = aEst, sector = aSector) {
    const writes = [{
      update: { name: name('produtos', id), fields: {
        id: string(id), estabelecimentoId: string(est), setorId: string(sector), nome: string('TESTE Produto'),
        status: string('ativo'), inativadoEm: {nullValue:null}, inativadoPor: {nullValue:null}, possuiHistorico: {booleanValue:quantity>0},
        quantidadeInicial: integer(quantity), estoqueAtual: integer(quantity),
      } },
      updateTransforms: [{ fieldPath: 'criadoEm', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: false },
    }, sectorChange(sector, id, 1)];
    if (quantity > 0) writes.push({
      update: { name: name('movimentacoes', `inicial_${id}`), fields: {
        estabelecimentoId: string(est), produtoId: string(id), setorId: string(sector), tipo: string('entrada'),
        quantidade: integer(quantity), observacao: string('Estoque inicial'), criadoPor: string(user.uid),
      } },
      updateTransforms: [{ fieldPath: 'criadoEm', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: false },
    });
    return writes;
  }
  const zero = randomUUID();
  const positive = randomUUID();
  const bProduct = randomUUID();
  await t.test('quantidade zero cria produto sem movimento e contador legado passa a 1', async () => {
    successful(await commit(productWrites(zero, 0)));
    const product = (await request('GET', `/produtos/${zero}`, a.token)).data;
    assert.equal(product.fields.estoqueAtual.integerValue, '0');
    assert.equal((await request('GET', `/movimentacoes/inicial_${zero}`, 'owner')).status, 404);
    assert.equal((await request('GET', `/setores/${aSector}`, a.token)).data.fields.quantidadeProdutos.integerValue, '1');
  });
  await t.test('quantidade 10 cria produto e entrada de mesma data atomicamente', async () => {
    successful(await commit(productWrites(positive, 10)));
    const product = (await request('GET', `/produtos/${positive}`, a.token)).data.fields;
    const movement = (await request('GET', `/movimentacoes/inicial_${positive}`, a.token)).data.fields;
    assert.equal(product.estoqueAtual.integerValue, '10');
    assert.deepEqual(product.criadoEm, movement.criadoEm);
    assert.equal(movement.quantidade.integerValue, '10');
  });
  successful(await commit(productWrites(bProduct, 0, b, bEst, bSector), b.token));
  await t.test('RNFB Android: contador double integral aceita cadastro e nega exclusão sem histórico', async () => {
    const id = randomUUID();
    const writes = productWrites(id, 0);
    writes[1].updateTransforms[0].increment = { doubleValue: 1.0 };
    successful(await commit(writes));
    const sector = (await request('GET', `/setores/${aSector}`, a.token)).data.fields;
    assert.equal(sector.quantidadeProdutos.doubleValue, 3);
    const decrement = sectorChange(aSector, id, -1);
    decrement.updateTransforms[0].increment = { doubleValue: -1.0 };
    denied(await commit([{ delete: name('produtos', id) }, decrement]));
    assert.equal((await request('GET', `/setores/${aSector}`, a.token)).data.fields.quantidadeProdutos.doubleValue, 3);
    assert.equal((await request('GET', `/movimentacoes/inicial_${id}`, 'owner')).status, 404);
  });
  for (const [label, quantity, mutate] of [
    ['estoque falso positivo', 10, (w) => { w[0].update.fields.estoqueAtual = integer(11); }],
    ['estoque falso zero', 0, (w) => { w[0].update.fields.estoqueAtual = integer(10); }],
    ['quantidade negativa', 0, (w) => { w[0].update.fields.quantidadeInicial = integer(-1); }],
    ['quantidade fracionária', 0, (w) => { w[0].update.fields.quantidadeInicial = { doubleValue: 0.5 }; }],
    ['quantidade excessiva', 0, (w) => { w[0].update.fields.quantidadeInicial = integer('9007199254740992'); }],
    ['mínimo negativo', 0, (w) => { w[0].update.fields.estoqueMinimo = integer(-1); }],
    ['mínimo fracionário', 0, (w) => { w[0].update.fields.estoqueMinimo = { doubleValue: 0.5 }; }],
    ['nome vazio', 0, (w) => { w[0].update.fields.nome = string(''); }],
    ['nome espaços', 0, (w) => { w[0].update.fields.nome = string('   '); }],
    ['nome não normalizado', 0, (w) => { w[0].update.fields.nome = string(' Produto '); }],
    ['nome excessivo', 0, (w) => { w[0].update.fields.nome = string('a'.repeat(121)); }],
    ['nome numérico', 0, (w) => { w[0].update.fields.nome = integer(1); }],
    ['descrição excessiva', 0, (w) => { w[0].update.fields.descricao = string('a'.repeat(2001)); }],
    ['campo extra produto', 0, (w) => { w[0].update.fields.extra = string('ataque'); }],
    ['id divergente', 0, (w) => { w[0].update.fields.id = string(randomUUID()); }],
    ['estabelecimento alheio', 0, (w) => { w[0].update.fields.estabelecimentoId = string(bEst); }],
    ['setor alheio', 0, (w) => { w[0].update.fields.setorId = string(bSector); }],
    ['setor inexistente', 0, (w) => { w[0].update.fields.setorId = string(randomUUID()); }],
    ['sem criadoEm', 0, (w) => { delete w[0].updateTransforms; }],
    ['sem contador', 0, (w) => { w.splice(1, 1); }],
    ['contador falso', 0, (w) => { w[1].updateTransforms[0].increment = integer(2); }],
    ['contador fracionário', 0, (w) => { w[1].updateTransforms[0].increment = { doubleValue: 0.5 }; }],
    ['contador float excessivo', 0, (w) => { w[1].updateTransforms[0].increment = { doubleValue: 9007199254740992 }; }],
    ['contador float negativo', 0, (w) => { w[1].updateTransforms[0].increment = { doubleValue: -3.0 }; }],
    ['registro parcial contador', 0, (w) => { w[0].update.fields.quantidadeMovimentacoes = integer(0); }],
    ['registro parcial ids', 0, (w) => { w[0].update.fields.movimentacaoIds = { arrayValue: { values: [] } }; }],
    ['registro parcial ponteiro', 10, (w) => { w[0].update.fields.ultimaMovimentacaoId = string('inicial_' + w[0].update.fields.id.stringValue); }],
    ['registro positivo sem ponteiro', 10, (w) => {
      w[0].update.fields.quantidadeMovimentacoes = integer(1);
      w[0].update.fields.movimentacaoIds = { arrayValue: { values: [string('inicial_' + w[0].update.fields.id.stringValue)] } };
    }],
    ['registro com elemento numérico', 10, (w) => {
      w[0].update.fields.quantidadeMovimentacoes = integer(1);
      w[0].update.fields.movimentacaoIds = { arrayValue: { values: [integer(123)] } };
      w[0].update.fields.ultimaMovimentacaoId = string('123');
    }],
    ['registro com ID contendo barra', 10, (w) => {
      w[0].update.fields.quantidadeMovimentacoes = integer(1);
      w[0].update.fields.movimentacaoIds = { arrayValue: { values: [string('id/invalido')] } };
      w[0].update.fields.ultimaMovimentacaoId = string('id/invalido');
    }],
    ['registro zero com ponteiro', 0, (w) => {
      w[0].update.fields.quantidadeMovimentacoes = integer(0);
      w[0].update.fields.movimentacaoIds = { arrayValue: { values: [] } };
      w[0].update.fields.ultimaMovimentacaoId = string(randomUUID());
    }],
    ['ponteiro falso', 0, (w) => { w[1].update.fields.ultimaOperacaoProdutoId = string(randomUUID()); }],
    ['inicial positiva sem entrada', 10, (w) => { w.pop(); }],
    ['movimento quantidade falsa', 10, (w) => { w[2].update.fields.quantidade = integer(9); }],
    ['movimento tipo saída', 10, (w) => { w[2].update.fields.tipo = string('saida'); }],
    ['movimento observação inválida', 10, (w) => { w[2].update.fields.observacao = string('Entrada normal'); }],
    ['movimento criador alheio', 10, (w) => { w[2].update.fields.criadoPor = string(b.uid); }],
    ['movimento estabelecimento alheio', 10, (w) => { w[2].update.fields.estabelecimentoId = string(bEst); }],
    ['movimento setor alheio', 10, (w) => { w[2].update.fields.setorId = string(bSector); }],
    ['movimento produto alheio', 10, (w) => { w[2].update.fields.produtoId = string(zero); }],
    ['movimento campo extra', 10, (w) => { w[2].update.fields.extra = string('ataque'); }],
    ['movimento id arbitrário', 10, (w) => { w[2].update.name = name('movimentacoes', randomUUID()); }],
    ['movimento timestamp antigo', 10, (w) => { delete w[2].updateTransforms; w[2].update.fields.criadoEm = { timestampValue: '2000-01-01T00:00:00Z' }; }],
    ['zero com movimento', 0, (w) => { const mov = productWrites(w[0].update.fields.id.stringValue, 1)[2]; mov.update.fields.quantidade = integer(0); w.push(mov); }],
  ]) await t.test(`criação nega ${label} sem produto parcial`, async () => {
    const id = randomUUID();
    const writes = productWrites(id, quantity);
    mutate(writes);
    denied(await commit(writes));
    assert.equal((await request('GET', `/produtos/${id}`, 'owner')).status, 404);
  });
  for (const [label, token] of [['anônimo', undefined], ['B', b.token]]) {
    for (const collection of ['produtos', 'movimentacoes']) await t.test(`${label} não lê ${collection} de A`, async () => {
      denied(await request('GET', `/${collection}/${collection === 'produtos' ? positive : 'inicial_' + positive}`, token));
    });
    await t.test(`${label} não cria produto de A`, async () => denied(await request('POST', ':commit', token, { writes: productWrites(randomUUID(), 10) })));
  }
  function queryProducts(est, sector) {
    return { structuredQuery: { from: [{ collectionId: 'produtos' }], where: { compositeFilter: { op: 'AND', filters: [
      { fieldFilter: { field: { fieldPath: 'estabelecimentoId' }, op: 'EQUAL', value: string(est) } },
      { fieldFilter: { field: { fieldPath: 'setorId' }, op: 'EQUAL', value: string(sector) } },
    ] } } } };
  }
  await t.test('query exata estabelecimento+setor retorna somente produtos A', async () => {
    const result = await request('POST', ':runQuery', a.token, queryProducts(aEst, aSector));
    successful(result);
    // O produto usado no teste de contador permanece cadastrado: delete agora é negado.
    assert.equal(result.data.filter((item) => item.document).length, 3);
  });
  await t.test('A não consulta B', async () => denied(await request('POST', ':runQuery', a.token, queryProducts(bEst, bSector))));
  await t.test('B não consulta A', async () => denied(await request('POST', ':runQuery', b.token, queryProducts(aEst, aSector))));
  await t.test('query global negada', async () => denied(await request('POST', ':runQuery', a.token, { structuredQuery: { from: [{ collectionId: 'produtos' }] } })));
  function edit(fields, changes) {
    const merged = { ...structuredClone(fields), ...changes };
    delete merged.atualizadoEm;
    return { update: { name: name('produtos', positive), fields: merged }, updateTransforms: [{ fieldPath: 'atualizadoEm', setToServerValue: 'REQUEST_TIME' }] };
  }
  const original = (await request('GET', `/produtos/${positive}`, a.token)).data.fields;
  for (const [label, changes] of [
    ['estoqueAtual', { estoqueAtual: integer(11) }], ['quantidadeInicial', { quantidadeInicial: integer(11) }],
    ['id', { id: string(randomUUID()) }], ['estabelecimentoId', { estabelecimentoId: string(bEst) }],
    ['setorId', { setorId: string(bSector) }], ['criadoEm', { criadoEm: { timestampValue: '2000-01-01T00:00:00Z' } }],
    ['campo extra', { extra: string('ataque') }], ['nome longo', { nome: string('a'.repeat(121)) }],
    ['descrição longa', { descricao: string('a'.repeat(2001)) }], ['mínimo negativo', { estoqueMinimo: integer(-1) }],
  ]) await t.test(`edição nega ${label}`, async () => denied(await commit([edit(original, changes)])));
  await t.test('edição permite nome descrição mínimo; saldo igual ao mínimo indica reposição', async () => {
    successful(await commit([edit(original, { nome: string('TESTE Editado'), descricao: string('Linha um\nLinha dois'), estoqueMinimo: integer(10) })]));
    const fields = (await request('GET', `/produtos/${positive}`, a.token)).data.fields;
    assert.equal(Number(fields.estoqueAtual.integerValue) <= Number(fields.estoqueMinimo.integerValue), true);
    assert.deepEqual(fields.criadoEm, original.criadoEm);
  });
  await t.test('RN-08 nega exclusão setor ocupado no backend', async () => denied(await request('DELETE', `/setores/${aSector}`, a.token)));
  await t.test('contador não pode ser zerado manualmente', async () => denied(await commit([sectorChange(aSector, positive, -2)])));
  await t.test('duas criações não compartilham uma atualização contador', async () => {
    const first = productWrites(randomUUID(), 0);
    const second = productWrites(randomUUID(), 0);
    denied(await commit([first[0], second[0], first[1]]));
  });
  await t.test('entrada isolada continua bloqueada mesmo para produto existente', async () => {
    denied(await commit([productWrites(positive, 10)[2]]));
    const normal = productWrites(randomUUID(), 10)[2];
    normal.update.fields.produtoId = string(positive);
    denied(await commit([normal]));
  });
  await t.test('movimento inicial não pode ser editado ou excluído sozinho', async () => {
    denied(await request('PATCH', `/movimentacoes/inicial_${positive}`, a.token, { fields: { quantidade: integer(11) } }));
    denied(await request('DELETE', `/movimentacoes/inicial_${positive}`, a.token));
  });
  await t.test('produto não pode ser excluído sem contador ou deixando órfão', async () => {
    denied(await request('DELETE', `/produtos/${positive}`, a.token));
    denied(await commit([{ delete: name('produtos', positive) }, sectorChange(aSector, positive, -1)]));
  });
  await t.test('B não exclui produto e movimento de A', async () => denied(await commit([
    { delete: name('produtos', positive) }, { delete: name('movimentacoes', `inicial_${positive}`) }, sectorChange(aSector, positive, -1),
  ], b.token)));
  await t.test('cascade atômico com histórico é bloqueado e preserva produto e movimento', async () => {
    denied(await commit([{ delete: name('produtos', positive) }, { delete: name('movimentacoes', `inicial_${positive}`) }, sectorChange(aSector, positive, -1)]));
    assert.equal((await request('GET', `/produtos/${positive}`, 'owner')).status, 200);
    assert.equal((await request('GET', `/movimentacoes/inicial_${positive}`, 'owner')).status, 200);
    denied(await request('DELETE', `/setores/${aSector}`, a.token));
  });
  await t.test('11A produto zero não é excluído e mantém bloqueio de setor', async () => {
    denied(await commit([{ delete: name('produtos', zero) }, sectorChange(aSector, zero, -1)]));
    denied(await request('DELETE', `/setores/${aSector}`, a.token));
  });
});

test('Etapa 7A: deltas atômicos, histórico, concorrência e cascade completo', async (t) => {
  const a = await signup();
  const b = await signup();
  const est = randomUUID();
  const otherEst = randomUUID();
  const sector = randomUUID();
  const otherSector = randomUUID();
  const integer = (value) => ({ integerValue: String(value) });
  const path = (collection, id) => `${database}/documents/${collection}/${id}`;
  const commit = (writes, token = a.token, transaction) => request('POST', ':commit', token, { writes, ...(transaction ? { transaction } : {}) });
  const success = (result) => assert.equal(result.status, 200, JSON.stringify(result.data));
  for (const [user, id, sid] of [[a, est, sector], [b, otherEst, otherSector]]) {
    success(await commit(onboarding(user, id), user.token));
    success(await commit([{ update: { name: path('setores', sid), fields: { id: string(sid), estabelecimentoId: string(id), nome: string('TESTE Etapa7A') } },
      updateTransforms: [{ fieldPath: 'criadoEm', setToServerValue: 'REQUEST_TIME' }] }], user.token));
  }
  function sectorChange(id, delta) {
    return { update: { name: path('setores', sector), fields: { ultimaOperacaoProdutoId: string(id) } },
      updateMask: { fieldPaths: ['ultimaOperacaoProdutoId'] }, updateTransforms: [
        { fieldPath: 'quantidadeProdutos', increment: { doubleValue: delta } },
        { fieldPath: 'atualizadoEm', setToServerValue: 'REQUEST_TIME' },
      ] };
  }
  async function create(quantity = 10) {
    const id = randomUUID();
    const writes = [{ update: { name: path('produtos', id), fields: {
      id: string(id), estabelecimentoId: string(est), setorId: string(sector), nome: string('TESTE Movimento'),
      descricao: string('Descrição de teste\nCom campos opcionais'), estoqueMinimo: integer(5),
      status: string('ativo'), inativadoEm: {nullValue:null}, inativadoPor: {nullValue:null}, possuiHistorico: {booleanValue:quantity>0},
        quantidadeInicial: integer(quantity), estoqueAtual: integer(quantity), quantidadeMovimentacoes: integer(quantity > 0 ? 1 : 0),
      movimentacaoIds: { arrayValue: { values: quantity > 0 ? [string(`inicial_${id}`)] : [] } },
      ...(quantity > 0 ? { ultimaMovimentacaoId: string(`inicial_${id}`) } : {}),
    } }, updateTransforms: [{ fieldPath: 'criadoEm', setToServerValue: 'REQUEST_TIME' }] }, sectorChange(id, 1)];
    if (quantity > 0) writes.push({ update: { name: path('movimentacoes', `inicial_${id}`), fields: {
      estabelecimentoId: string(est), produtoId: string(id), setorId: string(sector), tipo: string('entrada'), quantidade: integer(quantity),
      observacao: string('Estoque inicial'), criadoPor: string(a.uid),
    } }, updateTransforms: [{ fieldPath: 'criadoEm', setToServerValue: 'REQUEST_TIME' }] });
    success(await commit(writes));
    return id;
  }
  const read = (id, token = a.token) => request('GET', `/produtos/${id}`, token);
  function movementWrites(id, fields, type, quantity, movementId = randomUUID()) {
    const count = Number(fields.quantidadeMovimentacoes?.integerValue || (Number(fields.quantidadeInicial.integerValue) > 0 ? 1 : 0));
    const ids = fields.movimentacaoIds?.arrayValue.values || (Number(fields.quantidadeInicial.integerValue) > 0 ? [string(`inicial_${id}`)] : []);
    return [{ update: { name: path('movimentacoes', movementId), fields: {
      id: string(movementId), estabelecimentoId: string(est), produtoId: string(id), setorId: string(sector), tipo: string(type),
      quantidade: integer(quantity), observacao: string('TESTE Operação'), criadoPor: string(a.uid),
    } }, updateTransforms: [{ fieldPath: 'criadoEm', setToServerValue: 'REQUEST_TIME' }], currentDocument: { exists: false } },
    { update: { name: path('produtos', id), fields: {
      possuiHistorico: {booleanValue:true}, estoqueAtual: integer(Number(fields.estoqueAtual.integerValue) + (type === 'entrada' ? quantity : -quantity)),
      quantidadeMovimentacoes: integer(count + 1), movimentacaoIds: { arrayValue: { values: count < 6 ? [...ids, string(movementId)] : ids } },
      ultimaMovimentacaoId: string(movementId),
    } }, updateMask: { fieldPaths: ['estoqueAtual', 'quantidadeMovimentacoes', 'movimentacaoIds', 'ultimaMovimentacaoId', 'possuiHistorico'] },
    updateTransforms: [{ fieldPath: 'atualizadoEm', setToServerValue: 'REQUEST_TIME' }] }];
  }
  const product = await create();
  await t.test('entrada5 e saída4 produzem saldo11 e histórico válido', async () => {
    success(await commit(movementWrites(product, (await read(product)).data.fields, 'entrada', 5)));
    assert.equal((await read(product)).data.fields.estoqueAtual.integerValue, '15');
    success(await commit(movementWrites(product, (await read(product)).data.fields, 'saida', 4)));
    assert.equal((await read(product)).data.fields.estoqueAtual.integerValue, '11');
  });
  const before = (await read(product)).data.fields;
  for (const [label, mutate] of [
    ['saída maior estoque', (w) => { w[0].update.fields.quantidade = integer(12); w[1].update.fields.estoqueAtual = integer(-1); }],
    ['quantidade zero', (w) => { w[0].update.fields.quantidade = integer(0); }],
    ['quantidade negativa', (w) => { w[0].update.fields.quantidade = integer(-1); }],
    ['quantidade fracionária', (w) => { w[0].update.fields.quantidade = { doubleValue: 1.5 }; }],
    ['quantidade NaN', (w) => { w[0].update.fields.quantidade = { doubleValue: 'NaN' }; }],
    ['quantidade Infinity', (w) => { w[0].update.fields.quantidade = { doubleValue: 'Infinity' }; }],
    ['tipo inválido', (w) => { w[0].update.fields.tipo = string('ajuste'); }],
    ['criadoPor outro usuário', (w) => { w[0].update.fields.criadoPor = string(b.uid); }],
    ['produto estabelecimento alheio', (w) => { w[0].update.fields.estabelecimentoId = string(otherEst); }],
    ['setor incorreto', (w) => { w[0].update.fields.setorId = string(otherSector); }],
    ['delta diferente quantidade', (w) => { w[1].update.fields.estoqueAtual = integer(8); }],
    ['saldo negativo forjado', (w) => { w[1].update.fields.estoqueAtual = integer(-2); }],
    ['sem atualizar produto', (w) => { w.pop(); }],
    ['sem criar movimento', (w) => { w.shift(); }],
    ['ponteiro divergente', (w) => { w[1].update.fields.ultimaMovimentacaoId = string(randomUUID()); }],
    ['contador falso', (w) => { w[1].update.fields.quantidadeMovimentacoes = integer(99); }],
    ['registro omitido', (w) => { w[1].update.fields.movimentacaoIds = { arrayValue: { values: [] } }; }],
    ['registro trocado', (w) => { w[1].update.fields.movimentacaoIds.arrayValue.values[0] = string(randomUUID()); }],
    ['campoextra movimento', (w) => { w[0].update.fields.extra = string('ataque'); }],
    ['campoextra produto', (w) => { w[1].update.fields.extra = string('ataque'); w[1].updateMask.fieldPaths.push('extra'); }],
    ['observação longa', (w) => { w[0].update.fields.observacao = string('a'.repeat(2001)); }],
    ['observação espaços', (w) => { w[0].update.fields.observacao = string('   '); }],
    ['id documento divergente', (w) => { w[0].update.fields.id = string(randomUUID()); }],
    ['id normal ausente', (w) => { delete w[0].update.fields.id; }],
    ['quantidade inicial alterada', (w) => { w[1].update.fields.quantidadeInicial = integer(99); w[1].updateMask.fieldPaths.push('quantidadeInicial'); }],
    ['setor produto alterado', (w) => { w[1].update.fields.setorId = string(otherSector); w[1].updateMask.fieldPaths.push('setorId'); }],
    ['ponteiro removido', (w) => { delete w[1].update.fields.ultimaMovimentacaoId; }],
  ]) await t.test(`nega movimentação ${label} sem efeitos parciais`, async () => {
    const writes = movementWrites(product, before, 'saida', 1);
    const mid = writes[0].update.fields.id.stringValue;
    mutate(writes);
    denied(await commit(writes));
    assert.deepEqual((await read(product)).data.fields, before);
    assert.equal((await request('GET', `/movimentacoes/${mid}`, 'owner')).status, 404);
  });
  await t.test('dois movimentos não usam uma atualização produto', async () => {
    const first = movementWrites(product, before, 'saida', 1);
    const second = movementWrites(product, before, 'saida', 1);
    denied(await commit([first[0], second[0], first[1]]));
  });
  await t.test('replay da última movimentação não modifica estoque novamente', async () => {
    const lastId = before.ultimaMovimentacaoId.stringValue;
    denied(await commit(movementWrites(product, before, 'saida', 1, lastId)));
  });
  await t.test('movimentos existentes não permitem update ou delete individual', async () => {
    const id = before.ultimaMovimentacaoId.stringValue;
    denied(await request('PATCH', `/movimentacoes/${id}`, a.token, { fields: { quantidade: integer(2) } }));
    denied(await request('DELETE', `/movimentacoes/${id}`, a.token));
  });
  await t.test('B não movimenta produto de A', async () => denied(await commit(movementWrites(product, before, 'saida', 1), b.token)));
  await t.test('anônimo não cria movimentação atômica', async () => denied(await request('POST', ':commit', undefined, { writes: movementWrites(product, before, 'saida', 1) })));
  function historyQuery(establishmentId, productId) {
    return { structuredQuery: { from: [{ collectionId: 'movimentacoes' }], where: { compositeFilter: { op: 'AND', filters: [
      { fieldFilter: { field: { fieldPath: 'estabelecimentoId' }, op: 'EQUAL', value: string(establishmentId) } },
      { fieldFilter: { field: { fieldPath: 'produtoId' }, op: 'EQUAL', value: string(productId) } },
    ] } } } };
  }
  await t.test('histórico consulta apenas estabelecimento e produto retorna inicial e normais', async () => {
    const result = await request('POST', ':runQuery', a.token, historyQuery(est, product));
    success(result);
    const documents = result.data.filter((row) => row.document).map((row) => row.document);
    assert.equal(documents.length, 3);
    assert.ok(documents.every((doc) => doc.fields.produtoId.stringValue === product && doc.fields.estabelecimentoId.stringValue === est));
  });
  await t.test('B não consulta histórico A', async () => denied(await request('POST', ':runQuery', b.token, historyQuery(est, product))));
  await t.test('A não consulta histórico B mesmo vazio', async () => denied(await request('POST', ':runQuery', a.token, historyQuery(otherEst, randomUUID()))));
  await t.test('histórico global autenticado é negado', async () => denied(await request('POST', ':runQuery', a.token, { structuredQuery: { from: [{ collectionId: 'movimentacoes' }] } })));
  await t.test('anônimo não lê movimento normal', async () => denied(await request('GET', `/movimentacoes/${before.ultimaMovimentacaoId.stringValue}`)));
  await t.test('saída exatamente igual ao estoque zera saldo', async () => {
    success(await commit(movementWrites(product, before, 'saida', 11)));
    assert.equal((await read(product)).data.fields.estoqueAtual.integerValue, '0');
  });
  await t.test('saída com estoquezero é negada', async () => denied(await commit(movementWrites(product, (await read(product)).data.fields, 'saida', 1))));
  await t.test('produto inicialzero recebe entrada normal sem movimento inicial', async () => {
    const zero = await create(0);
    success(await commit(movementWrites(zero, (await read(zero)).data.fields, 'entrada', 2)));
    assert.equal((await read(zero)).data.fields.estoqueAtual.integerValue, '2');
    assert.equal((await request('GET', `/movimentacoes/inicial_${zero}`, 'owner')).status, 404);
  });
  for (const [label, invalid] of [
    ['número', integer(123)], ['null', { nullValue: null }], ['boolean', { booleanValue: true }],
    ['lista', { arrayValue: { values: [string('id')] } }],
    ['map', { mapValue: { fields: { id: string('id') } } }],
    ['barra', string('id/invalido')], ['string vazia', string('')], ['137 caracteres', string('a'.repeat(137))],
  ]) await t.test(`registro importado com elemento ${label} nega edição sem coerção join`, async () => {
    const id = await create(0);
    // Bypass exclusivo do Emulator prepara legado administrativo corrompido.
    // Mantém ponteiro/último ID coerentes para exercitar o tipo do primeiro elemento.
    const seeded = await request('POST', ':commit', 'owner', { writes: [{
      update: { name: path('produtos', id), fields: {
        quantidadeMovimentacoes: integer(2), movimentacaoIds: { arrayValue: { values: [invalid, string('ultimo')] } },
        ultimaMovimentacaoId: string('ultimo'),
      } }, updateMask: { fieldPaths: ['quantidadeMovimentacoes', 'movimentacaoIds', 'ultimaMovimentacaoId'] },
    }] });
    if (label === 'lista') {
      // Firestore impede arrays aninhados antes das Rules, até com bypass owner.
      assert.equal(seeded.status, 400);
      assert.equal(seeded.data.error.status, 'INVALID_ARGUMENT');
      return;
    }
    success(seeded);
    denied(await commit([{ update: { name: path('produtos', id), fields: { nome: string('TESTE Editado') } },
      updateMask: { fieldPaths: ['nome'] }, updateTransforms: [{ fieldPath: 'atualizadoEm', setToServerValue: 'REQUEST_TIME' }] }]));
  });
  function cascade(id, fields) {
    return [{ delete: path('produtos', id) }, sectorChange(id, -1),
      ...(fields.movimentacaoIds.arrayValue.values || []).map((value) => ({ delete: path('movimentacoes', value.stringValue) }))];
  }
  await t.test('cascade cap6 é bloqueado e preserva todas movimentações', async () => {
    const id = await create();
    for (let index = 0; index < 5; index++) {
      const snapshot = await read(id);
      const writes = movementWrites(id, snapshot.data.fields, 'entrada', 1, 'teste_' + randomUUID());
      writes[1].currentDocument = { updateTime: snapshot.data.updateTime };
      // Reproduz helper REST Android: produto primeiro, movimento em seguida.
      success(await commit(writes.reverse()));
    }
    const fields = (await read(id)).data.fields;
    assert.equal(fields.quantidadeMovimentacoes.integerValue, '6');
    const writes = cascade(id, fields);
    denied(await commit(writes.slice(0, -1)), 'não omitir movimento normal');
    denied(await commit(writes.filter((write) => !write.delete?.includes('/movimentacoes/inicial_'))), 'não omitir inicial');
    denied(await commit(writes));
    for (const write of writes.filter((write) => write.delete)) assert.equal((await request('GET', `/${write.delete.split('/documents/')[1]}`, 'owner')).status, 200);
  });
  await t.test('cap+1 e cap+2 permitem movimentar com opcionais, mas bloqueiam cascade', async () => {
    const id = await create();
    const extra = [];
    for (let index = 0; index < 7; index++) {
      const writes = movementWrites(id, (await read(id)).data.fields, 'entrada', 1);
      extra.push(writes[0].update.fields.id.stringValue);
      success(await commit(writes));
    }
    const fields = (await read(id)).data.fields;
    assert.equal(fields.quantidadeMovimentacoes.integerValue, '8');
    assert.equal(fields.movimentacaoIds.arrayValue.values.length, 6);
    denied(await commit([{ delete: path('produtos', id) }, sectorChange(id, -1),
      ...[`inicial_${id}`, ...extra].map((mid) => ({ delete: path('movimentacoes', mid) }))]));
    assert.equal((await read(id)).status, 200);
    for (const mid of extra) assert.equal((await request('GET', `/movimentacoes/${mid}`, a.token)).status, 200);
  });
  await t.test('concorrência de saídas8vs7 com versão compartilhada confirma uma operação atômica', async () => {
    const id = await create();
    // A mesma versão simula duas operações que leram estoque10 antes de escrever.
    // Preconditions exercitam conflito otimista sem locks pessimistas do Emulator REST.
    const [snapshotA, snapshotB] = await Promise.all([read(id), read(id)]);
    success(snapshotA); success(snapshotB);
    const writesA = movementWrites(id, snapshotA.data.fields, 'saida', 8);
    const writesB = movementWrites(id, snapshotB.data.fields, 'saida', 7);
    writesA[1].currentDocument = { updateTime: snapshotA.data.updateTime };
    writesB[1].currentDocument = { updateTime: snapshotB.data.updateTime };
    const results = await Promise.all([commit(writesA), commit(writesB)]);
    assert.equal(results.filter((result) => result.status === 200).length, 1, JSON.stringify(results));
    assert.equal(results.filter((result) => result.status !== 200).length, 1);
    const saldo = Number((await read(id)).data.fields.estoqueAtual.integerValue);
    assert.ok(saldo === 2 || saldo === 3);
    const confirmed = [];
    for (const writes of [writesA, writesB]) {
      const doc = await request('GET', `/movimentacoes/${writes[0].update.fields.id.stringValue}`, 'owner');
      if (doc.status === 200) confirmed.push(Number(doc.data.fields.quantidade.integerValue));
    }
    assert.equal(confirmed.length, 1);
    assert.equal(saldo, 10 - confirmed[0]);
  });
});

test('7B edição/exclusão: deltas, imutabilidade, isolamento e concorrência',async t=>{
 const u=await signup(), other=await signup(), pending=await signup(), est=randomUUID(), sector=randomUUID();
 const num=n=>({integerValue:String(n)}), arr=ids=>({arrayValue:{values:ids.map(string)}}), path=(col,id)=>database+'/documents/'+col+'/'+id;
 const ok=r=>assert.equal(r.status,200,JSON.stringify(r.data));
 const commit=(writes,token=u.token)=>request('POST',':commit',token,{writes});
 ok(await commit(onboarding(u,est))); ok(await commit(onboarding(other,randomUUID()),other.token));
 async function fixture(tipo='entrada',q=5,stock=10,n=1,initial=false){
  const p=randomUUID(), id=initial?'inicial_'+p:randomUUID();
  const ids=[id,...Array.from({length:n-1},()=>randomUUID())];
  const product={id:string(p),estabelecimentoId:string(est),setorId:string(sector),nome:string('Teste'),quantidadeInicial:num(initial?q:0),estoqueAtual:num(stock),quantidadeMovimentacoes:num(n),movimentacaoIds:arr(ids.slice(0,6)),ultimaMovimentacaoId:string(ids.at(-1)),criadoEm:{timestampValue:'2026-10-01T12:00:00Z'}};
  const movement={id:string(id),estabelecimentoId:string(est),setorId:string(sector),produtoId:string(p),tipo:string(tipo),quantidade:num(q),observacao:string(initial?'Estoque inicial':'Teste'),criadoPor:string(u.uid),criadoEm:{timestampValue:'2026-10-01T12:00:00Z'}};
  // Fixtures administrativas somente no projeto demo, incluindo estoque coerente nos cenários de consistência.
  ok(await commit([{update:{name:path('produtos',p),fields:product}},...ids.map(mid=>({update:{name:path('movimentacoes',mid),fields:{...movement,id:string(mid)}}})),{update:{name:path('setores',sector),fields:{id:string(sector),estabelecimentoId:string(est),nome:string('Setor'),quantidadeProdutos:num(1),criadoEm:product.criadoEm}}}],'owner'));
  return {p,id,ids,product,movement};
 }
 const read=(c,id,token=u.token)=>request('GET','/'+c+'/'+id,token);
 const timestamp=[{fieldPath:'atualizadoEm',setToServerValue:'REQUEST_TIME'}];
 function writes(f,q,remove=false,observation='Editada'){
  const old=Number(f.movement.quantidade.integerValue), stock=Number(f.product.estoqueAtual.integerValue), sign=f.movement.tipo.stringValue==='entrada'?1:-1;
  const movement=remove?{delete:path('movimentacoes',f.id)}:{update:{name:path('movimentacoes',f.id),fields:{quantidade:num(q),...(observation!==undefined?{observacao:string(observation)}:{})}},updateMask:{fieldPaths:['quantidade','observacao']},updateTransforms:timestamp};
  const fields={estoqueAtual:num(stock+sign*(remove?-old:q-old)),ultimaMovimentacaoId:string(f.id)};
  if(remove){fields.quantidadeMovimentacoes=num(Number(f.product.quantidadeMovimentacoes.integerValue)-1);fields.movimentacaoIds=arr(f.ids.slice(0,6).filter(id=>id!==f.id));}
  return [movement,{update:{name:path('produtos',f.p),fields},updateMask:{fieldPaths:Object.keys(fields)},updateTransforms:timestamp}];
 }
 for(const tipo of ['entrada','saida']){
  for(const q of [3,8]) await t.test('edita '+tipo+' para '+q,async()=>{const f=await fixture(tipo);ok(await commit(writes(f,q)));assert.equal(Number((await read('produtos',f.p)).data.fields.estoqueAtual.integerValue),10+(tipo==='entrada'?1:-1)*(q-5));});
  for(const [label,change] of [
   ['zero',w=>w[0].update.fields.quantidade=num(0)],['negativa',w=>w[0].update.fields.quantidade=num(-1)],['fração',w=>w[0].update.fields.quantidade={doubleValue:1.5}],['NaN',w=>w[0].update.fields.quantidade={doubleValue:'NaN'}],['Infinity',w=>w[0].update.fields.quantidade={doubleValue:'Infinity'}],
   ...['id','estabelecimentoId','produtoId','setorId','tipo','criadoPor','criadoEm','extra'].map(field=>[field,w=>{w[0].update.fields[field]=field==='criadoEm'?{timestampValue:'2000-01-01T00:00:00Z'}:string('forjado');w[0].updateMask.fieldPaths.push(field);}]),
   ['observação longa',w=>w[0].update.fields.observacao=string('a'.repeat(2001))],['sem produto',w=>w.pop()],['sem movimento',w=>w.shift()],['saldo divergente',w=>w[1].update.fields.estoqueAtual=num(999)],
  ]) await t.test('nega edit '+tipo+' '+label,async()=>{const f=await fixture(tipo), w=writes(f,8);change(w);denied(await commit(w));assert.deepEqual((await read('produtos',f.p)).data.fields,f.product);assert.deepEqual((await read('movimentacoes',f.id)).data.fields,f.movement);});
 }
 await t.test('reduzir entrada ou aumentar saída abaixo de zero nega tudo',async()=>{for(const tipo of ['entrada','saida']){const f=await fixture(tipo,5,1);denied(await commit(writes(f,tipo==='entrada'?1:8)));assert.deepEqual((await read('produtos',f.p)).data.fields,f.product);}});
 for(const remove of [false,true])await t.test(remove?'remover observação opcional':'somente observação',async()=>{
  const f=await fixture();const w=writes(f,5,false,remove?undefined:'Nova');
  if(remove)delete w[0].update.fields.observacao;
  ok(await commit([w[0]]));assert.deepEqual((await read('produtos',f.p)).data.fields,f.product);
  assert.equal('observacao' in (await read('movimentacoes',f.id)).data.fields,!remove);
 });
 for(const [tipo,stock,valid] of [['entrada',10,true],['entrada',5,true],['entrada',4,false],['saida',10,true]])await t.test('delete '+tipo+' saldo '+stock,async()=>{
  const f=await fixture(tipo,5,stock),result=await commit(writes(f,0,true));
  if(!valid){denied(result);assert.deepEqual((await read('produtos',f.p)).data.fields,f.product);return;}
  ok(result);assert.equal((await read('movimentacoes',f.id,'owner')).status,404);assert.equal(Number((await read('produtos',f.p)).data.fields.estoqueAtual.integerValue),stock+(tipo==='entrada'?-5:5));
 });
 for(const action of ['edit','delete'])for(const who of ['anonymous','pending','other'])await t.test(action+' nega '+who,async()=>{
  const f=await fixture();const token=who==='anonymous'?undefined:who==='pending'?pending.token:other.token;
  denied(await request('POST',':commit',token,{writes:writes(f,8,action==='delete')}));
 });
 await t.test('delete sozinho e saldo sozinho negados',async()=>{const f=await fixture();for(const w of writes(f,0,true))denied(await commit([w]));});
 await t.test('dois deletes não compartilham delta único',async()=>{const f=await fixture('entrada',5,10,2);const w=writes(f,0,true);w.push({delete:path('movimentacoes',f.ids[1])});denied(await commit(w));});
 await t.test('inicial editável e excluível preserva quantidadeInicial; histórico igual saldo',async()=>{
  const f=await fixture('entrada',10,10,1,true);ok(await commit(writes(f,8)));
  f.product=(await read('produtos',f.p)).data.fields;f.movement=(await read('movimentacoes',f.id)).data.fields;
  assert.equal(f.product.quantidadeInicial.integerValue,'10');assert.equal(f.product.estoqueAtual.integerValue,f.movement.quantidade.integerValue);
  ok(await commit(writes(f,0,true)));assert.equal((await read('produtos',f.p)).data.fields.estoqueAtual.integerValue,'0');
 });
 for(const n of [10,20,50])await t.test('cascade '+n+' nega conjunto completo sem remover nada',async()=>{
  const f=await fixture('entrada',1,n,n);
  const w=[{delete:path('produtos',f.p)},...f.ids.map(id=>({delete:path('movimentacoes',id)})),{update:{name:path('setores',sector),fields:{quantidadeProdutos:num(0),ultimaOperacaoProdutoId:string(f.p)}},updateMask:{fieldPaths:['quantidadeProdutos','ultimaOperacaoProdutoId']},updateTransforms:timestamp}];
  denied(await commit(w));assert.deepEqual((await read('produtos',f.p)).data.fields,f.product);for(const id of f.ids)assert.equal((await read('movimentacoes',id)).status,200);
 });
 function newMovement(f,tipo,q){
  const id=randomUUID(), count=Number(f.product.quantidadeMovimentacoes.integerValue), ids=(f.product.movimentacaoIds.arrayValue.values||[]).map(v=>v.stringValue);
  const fields={possuiHistorico:{booleanValue:true},estoqueAtual:num(Number(f.product.estoqueAtual.integerValue)+(tipo==='entrada'?q:-q)),quantidadeMovimentacoes:num(count+1),movimentacaoIds:arr(ids.length<6?[...ids,id]:ids),ultimaMovimentacaoId:string(id)};
  return [{update:{name:path('movimentacoes',id),fields:{id:string(id),estabelecimentoId:string(est),produtoId:string(f.p),setorId:string(sector),tipo:string(tipo),quantidade:num(q),criadoPor:string(u.uid)}},updateTransforms:[{fieldPath:'criadoEm',setToServerValue:'REQUEST_TIME'}]},
   {update:{name:path('produtos',f.p),fields},updateMask:{fieldPaths:Object.keys(fields)},updateTransforms:timestamp}];
 }
 async function consistency(f){
  const product=(await read('produtos',f.p)).data.fields;
  const query=await request('POST',':runQuery',u.token,{structuredQuery:{from:[{collectionId:'movimentacoes'}],where:{compositeFilter:{op:'AND',filters:[{fieldFilter:{field:{fieldPath:'estabelecimentoId'},op:'EQUAL',value:string(est)}},{fieldFilter:{field:{fieldPath:'produtoId'},op:'EQUAL',value:string(f.p)}}]}}}});
  ok(query);const total=query.data.filter(r=>r.document).reduce((sum,r)=>sum+(r.document.fields.tipo.stringValue==='entrada'?1:-1)*Number(r.document.fields.quantidade.integerValue),0);
  assert.equal(Number(product.estoqueAtual.integerValue),total);assert.ok(total>=0);return total;
 }
 for(const scenario of ['A','B'])await t.test('concorrência '+scenario+' com reavaliação e histórico real',async()=>{
  const f=await fixture('entrada',scenario==='A'?12:10,scenario==='A'?12:10,1,true);
  await consistency(f);
  const created=newMovement(f,scenario==='A'?'saida':'entrada',scenario==='A'?2:5);ok(await commit(created));
  f.id=created[0].update.fields.id.stringValue;f.movement=(await read('movimentacoes',f.id)).data.fields;
  const snapshot=await read('produtos',f.p);f.product=snapshot.data.fields;f.ids=f.product.movimentacaoIds.arrayValue.values.map(v=>v.stringValue);await consistency(f);
  const change=writes(f,8,scenario==='B'), outgoing=newMovement(f,'saida',scenario==='A'?5:12);
  change[1].currentDocument={updateTime:snapshot.data.updateTime};outgoing[1].currentDocument={updateTime:snapshot.data.updateTime};
  const results=await Promise.all([commit(change),commit(outgoing)]);assert.equal(results.filter(r=>r.status===200).length,1);
  const losing=results.findIndex(r=>r.status!==200);assert.ok([403,409].includes(results[losing].status),JSON.stringify(results[losing])); // REST pode avaliar Rules antes da precondição.
  const fresh=await read('produtos',f.p);f.product=fresh.data.fields;f.ids=f.product.movimentacaoIds.arrayValue.values.map(v=>v.stringValue);
  const retry=losing===0?writes(f,8,scenario==='B'):newMovement(f,'saida',scenario==='A'?5:12);retry[1].currentDocument={updateTime:fresh.data.updateTime};denied(await commit(retry));
  await consistency(f);
 });

 for(const scenario of ['duas entradas','edição de entrada e nova saída'])await t.test('Etapa 10E: '+scenario+' concorrentes confirmam após releitura sem perder delta',async()=>{
  const f=await fixture('entrada',10,10,1,true);
  const snapshot=await read('produtos',f.p);
  const operations=scenario==='duas entradas'
   ? [newMovement(f,'entrada',5),newMovement(f,'entrada',7)]
   : [writes(f,12),newMovement(f,'saida',3)];
  for(const operation of operations)operation[1].currentDocument={updateTime:snapshot.data.updateTime};
  const results=await Promise.all(operations.map(operation=>commit(operation)));
  assert.equal(results.filter(result=>result.status===200).length,1);
  const loser=results.findIndex(result=>result.status!==200);
  assert.ok([403,409].includes(results[loser].status));
  await consistency(f);
  const fresh=await read('produtos',f.p);f.product=fresh.data.fields;
  const retry=scenario==='duas entradas'?newMovement(f,'entrada',loser===0?5:7)
   : loser===0?writes(f,12):newMovement(f,'saida',3);
  // A solicitação que ainda não confirmou conserva seu ID na releitura.
  if(scenario==='duas entradas'||loser===1){
   const originalId=operations[loser][0].update.fields.id.stringValue;
   const retryId=retry[0].update.fields.id.stringValue;
   retry[0].update.name=path('movimentacoes',originalId);
   retry[0].update.fields.id=string(originalId);
   retry[1].update.fields.ultimaMovimentacaoId=string(originalId);
   retry[1].update.fields.movimentacaoIds.arrayValue.values=retry[1].update.fields.movimentacaoIds.arrayValue.values.map(id=>id.stringValue===retryId?string(originalId):id);
  }
  retry[1].currentDocument={updateTime:fresh.data.updateTime};ok(await commit(retry));
  assert.equal(await consistency(f),scenario==='duas entradas'?22:9);
  const final=(await read('produtos',f.p)).data.fields;
  assert.equal(Number(final.quantidadeMovimentacoes.integerValue),scenario==='duas entradas'?3:2);
 });

 await t.test('registro parcial após delete registrado e não registrado mantém histórico e cascade seguro',async()=>{
  const f=await fixture('entrada',1,10,10);
  const originals=[...f.ids];
  for(const id of [originals[0],...originals.slice(6)]){
   f.id=id;f.product=(await read('produtos',f.p)).data.fields;f.movement=(await read('movimentacoes',id)).data.fields;
   f.ids=(f.product.movimentacaoIds.arrayValue.values||[]).map(v=>v.stringValue);
   ok(await commit(writes(f,0,true)));await consistency(f);
  }
  f.product=(await read('produtos',f.p)).data.fields;f.ids=f.product.movimentacaoIds.arrayValue.values.map(v=>v.stringValue);
  assert.equal(f.product.quantidadeMovimentacoes.integerValue,'5');assert.equal(f.ids.length,5);
  const cascade=[{delete:path('produtos',f.p)},...f.ids.map(id=>({delete:path('movimentacoes',id)})),{update:{name:path('setores',sector),fields:{quantidadeProdutos:num(0),ultimaOperacaoProdutoId:string(f.p)}},updateMask:{fieldPaths:['quantidadeProdutos','ultimaOperacaoProdutoId']},updateTransforms:timestamp}];
  denied(await commit(cascade.slice(0,-2).concat(cascade.at(-1))));denied(await commit(cascade));
  assert.equal((await read('produtos',f.p,'owner')).status,200);for(const id of f.ids)assert.equal((await read('movimentacoes',id,'owner')).status,200);
 });
 await t.test('inicial legada sem id permanece sem id na edição e segue exclusão',async()=>{
  const f=await fixture('entrada',10,10,1,true);delete f.movement.id;
  ok(await commit([{update:{name:path('movimentacoes',f.id),fields:f.movement}}],'owner'));
  ok(await commit(writes(f,8)));f.product=(await read('produtos',f.p)).data.fields;f.movement=(await read('movimentacoes',f.id)).data.fields;
  assert.equal('id' in f.movement,false);ok(await commit(writes(f,0,true)));assert.equal((await read('produtos',f.p)).data.fields.quantidadeInicial.integerValue,'10');
 });

});

test('Etapa 10B: ciclo, histórico irreversível, legado, RN08 e isolamento', async t => {
 const a=await signup(),b=await signup(), ea=randomUUID(),eb=randomUUID(), sa=randomUUID(),sb=randomUUID();
 const num=n=>({integerValue:String(n)}),nil={nullValue:null},bool=v=>({booleanValue:v});
 const path=(c,id)=>`${database}/documents/${c}/${id}`;
 const commit=(w,token=a.token)=>request('POST',':commit',token,{writes:w});
 const ok=r=>assert.equal(r.status,200,JSON.stringify(r.data));
 const stamp=fieldPath=>({fieldPath,setToServerValue:'REQUEST_TIME'});
 const update=(c,id,fields,extra=[])=>({update:{name:path(c,id),fields},updateMask:{fieldPaths:Object.keys(fields)},updateTransforms:[stamp('atualizadoEm'),...extra]});
 const sectorChange=(s,id,delta)=>({update:{name:path('setores',s),fields:{ultimaOperacaoProdutoId:string(id)}},updateMask:{fieldPaths:['ultimaOperacaoProdutoId']},updateTransforms:[stamp('atualizadoEm'),{fieldPath:'quantidadeProdutos',increment:num(delta)}]});
 for(const [u,e,s] of [[a,ea,sa],[b,eb,sb]]) {
  ok(await commit(onboarding(u,e),u.token));
  ok(await commit([{update:{name:path('setores',s),fields:{id:string(s),estabelecimentoId:string(e),nome:string('Ciclo')}},updateTransforms:[stamp('criadoEm')]}],u.token));
 }
 function creation(id,q,u=a,e=ea,s=sa) {
  const initial='inicial_'+id;
  const writes=[{update:{name:path('produtos',id),fields:{id:string(id),estabelecimentoId:string(e),setorId:string(s),nome:string('Ciclo'),quantidadeInicial:num(q),estoqueAtual:num(q),status:string('ativo'),inativadoEm:nil,inativadoPor:nil,possuiHistorico:bool(q>0),quantidadeMovimentacoes:num(q>0?1:0),movimentacaoIds:{arrayValue:{values:q>0?[string(initial)]:[]}},...(q>0?{ultimaMovimentacaoId:string(initial)}:{})}},updateTransforms:[stamp('criadoEm'),stamp('atualizadoEm')]},sectorChange(s,id,1)];
  if(q>0)writes.push({update:{name:path('movimentacoes',initial),fields:{id:string(initial),estabelecimentoId:string(e),setorId:string(s),produtoId:string(id),tipo:string('entrada'),quantidade:num(q),observacao:string('Estoque inicial'),criadoPor:string(u.uid)}},updateTransforms:[stamp('criadoEm')]});
  return writes;
 }
 const zero=randomUUID(),positive=randomUUID(),other=randomUUID();
 await t.test('criação zero ativo histórico false',async()=>ok(await commit(creation(zero,0))));
 await t.test('criação positiva ativo histórico true com inicial',async()=>ok(await commit(creation(positive,10))));
 ok(await commit(creation(other,10,b,eb,sb),b.token));
 for(const [label,change] of [
 ['marcador falso com inicial',w=>w[0].update.fields.possuiHistorico=bool(false)],
 ['marcador true sem movimento',w=>w[0].update.fields.possuiHistorico=bool(true)],
 ['sem marcador',w=>delete w[0].update.fields.possuiHistorico],
 ['sem status',w=>delete w[0].update.fields.status],
 ['status inválido',w=>w[0].update.fields.status=string('arquivado')],
 ['nascer inativo',w=>w[0].update.fields.status=string('inativo')],
 ['timestamp indevido ativo',w=>w[0].update.fields.inativadoEm={timestampValue:'2026-10-01T00:00:00Z'}],
 ['UID indevido ativo',w=>w[0].update.fields.inativadoPor=string(a.uid)],
 ['bool inválido',w=>w[0].update.fields.possuiHistorico=string('false')]]) await t.test('nega criação '+label,async()=>{const w=creation(randomUUID(),label==='marcador falso com inicial'?10:0);change(w);denied(await commit(w));});
 const inactive=(id,u=a)=>update('produtos',id,{status:string('inativo'),inativadoPor:string(u.uid)},[stamp('inativadoEm')]);
 const active=id=>update('produtos',id,{status:string('ativo'),inativadoEm:nil,inativadoPor:nil});
 for(const [label,fields,transforms] of [
 ['UID diferente',{status:string('inativo'),inativadoPor:string(b.uid)},[stamp('inativadoEm')]],
 ['data antiga',{status:string('inativo'),inativadoPor:string(a.uid),inativadoEm:{timestampValue:'2026-10-01T00:00:00Z'}},[]],
 ['sem autor',{status:string('inativo'),inativadoPor:nil},[stamp('inativadoEm')]],
 ['status inválido',{status:string('pausado')},[]],
 ['timestamp em edição comum',{inativadoEm:{timestampValue:'2026-10-01T00:00:00Z'}},[]],
 ['UID em edição comum',{inativadoPor:string(a.uid)},[]],
 ['true para false',{possuiHistorico:bool(false)},[]],
 ['remover marcador',{},[]]]) await t.test('nega update '+label,async()=>{
  const w=update('produtos',positive,fields,transforms);if(label==='remover marcador')w.updateMask.fieldPaths=['possuiHistorico'];denied(await commit([w]));
 });
 await t.test('false para true sem primeiro movimento é negado',async()=>denied(await commit([update('produtos',zero,{possuiHistorico:bool(true)})])));
 await t.test('inativação válida preserva saldo e histórico',async()=>{ok(await commit([inactive(positive)]));const p=(await request('GET','/produtos/'+positive,a.token)).data.fields;assert.equal(p.estoqueAtual.integerValue,'10');assert.equal(p.possuiHistorico.booleanValue,true);assert.equal(p.inativadoPor.stringValue,a.uid);});
 await t.test('RN08 produto inativo bloqueia setor',async()=>denied(await request('DELETE','/setores/'+sa,a.token)));
 function movement(id,q=1,type='entrada') {
  const m=randomUUID();return [{update:{name:path('movimentacoes',m),fields:{id:string(m),estabelecimentoId:string(ea),setorId:string(sa),produtoId:string(id),tipo:string(type),quantidade:num(q),criadoPor:string(a.uid)}},updateTransforms:[stamp('criadoEm')]},update('produtos',id,{estoqueAtual:num(id===positive?10+q:q),possuiHistorico:bool(true),quantidadeMovimentacoes:num(id===positive?2:1),movimentacaoIds:{arrayValue:{values:id===positive?[string('inicial_'+id),string(m)]:[string(m)]}},ultimaMovimentacaoId:string(m)})];
 }
 await t.test('entrada em inativo negada',async()=>denied(await commit(movement(positive))));
 await t.test('saída em inativo negada',async()=>{const w=movement(positive,1,'saida');w[1].update.fields.estoqueAtual=num(9);denied(await commit(w));});
 await t.test('editar movimento inativo com delta negado',async()=>denied(await commit([update('movimentacoes','inicial_'+positive,{quantidade:num(11)}),update('produtos',positive,{estoqueAtual:num(11),ultimaMovimentacaoId:string('inicial_'+positive)})])));
 await t.test('editar só observação inativo negado',async()=>denied(await commit([update('movimentacoes','inicial_'+positive,{observacao:string('Teste')})])));
 const removeInitial=id=>[{delete:path('movimentacoes','inicial_'+id)},update('produtos',id,{estoqueAtual:num(0),quantidadeMovimentacoes:num(0),movimentacaoIds:{arrayValue:{values:[]}},ultimaMovimentacaoId:string('inicial_'+id)})];
 await t.test('excluir movimento inativo negado',async()=>denied(await commit(removeInitial(positive))));
 await t.test('leitura histórica de inativo permitida',async()=>ok(await request('GET','/movimentacoes/inicial_'+positive,a.token)));
 for(const [label,w] of [['autor retocado',update('produtos',positive,{inativadoPor:string(b.uid)})],['data retocada',update('produtos',positive,{},[stamp('inativadoEm')])],['reativar sem limpar auditoria',update('produtos',positive,{status:string('ativo')})]])await t.test('nega '+label,async()=>denied(await commit([w])));
 await t.test('reativação válida limpa auditoria',async()=>{ok(await commit([active(positive)]));const f=(await request('GET','/produtos/'+positive,a.token)).data.fields;assert.equal(f.inativadoEm.nullValue,null);assert.equal(f.inativadoPor.nullValue,null);});
 await t.test('RN08 produto ativo bloqueia setor',async()=>denied(await request('DELETE','/setores/'+sa,a.token)));
 await t.test('delete com histórico nega mesmo incluindo cascade',async()=>denied(await commit([{delete:path('produtos',positive)},{delete:path('movimentacoes','inicial_'+positive)},sectorChange(sa,positive,-1)])));
 await t.test('excluir último movimento ativo preserva true e continua bloqueando delete',async()=>{ok(await commit(removeInitial(positive)));const f=(await request('GET','/produtos/'+positive,a.token)).data.fields;assert.equal(f.possuiHistorico.booleanValue,true);denied(await commit([{delete:path('produtos',positive)},sectorChange(sa,positive,-1)]));});
 await t.test('primeiro movimento exige marcador no mesmo commit',async()=>{const w=movement(zero);delete w[1].update.fields.possuiHistorico;w[1].updateMask.fieldPaths=w[1].updateMask.fieldPaths.filter(x=>x!=='possuiHistorico');denied(await commit(w));});
 await t.test('primeiro movimento false para true atômico',async()=>{ok(await commit(movement(zero)));assert.equal((await request('GET','/produtos/'+zero,a.token)).data.fields.possuiHistorico.booleanValue,true);});
 const disposable=randomUUID();ok(await commit(creation(disposable,0)));
 await t.test('11A delete sem histórico negado com RN08',async()=>denied(await commit([{delete:path('produtos',disposable)},sectorChange(sa,disposable,-1)])));
 const disposableInactive=randomUUID();ok(await commit(creation(disposableInactive,0)));ok(await commit([inactive(disposableInactive)]));
 await t.test('11A delete inativo sem histórico negado',async()=>denied(await commit([{delete:path('produtos',disposableInactive)},sectorChange(sa,disposableInactive,-1)])));
 const legacy=randomUUID(),w=creation(legacy,0);for(const key of ['status','inativadoEm','inativadoPor','possuiHistorico'])delete w[0].update.fields[key];
 ok(await commit(w,'owner'));
 await t.test('delete legado sem marcador negado',async()=>denied(await commit([{delete:path('produtos',legacy)},sectorChange(sa,legacy,-1)])));
 await t.test('legado inativa e reativa sem inventar marcador false',async()=>{ok(await commit([inactive(legacy)]));ok(await commit([active(legacy)]));assert.equal('possuiHistorico' in (await request('GET','/produtos/'+legacy,a.token)).data.fields,false);});
 await t.test('legado continua movimentável e torna marcador true',async()=>ok(await commit(movement(legacy))));
 for(const [label,token,id,s] of [['A para B',a.token,other,sb],['B para A',b.token,positive,sa],['anônimo',null,positive,sa]]) {
  await t.test(label+' nega leitura',async()=>denied(await request('GET','/produtos/'+id,token)));
  await t.test(label+' nega inativação',async()=>denied(await commit([inactive(id)],token)));
  await t.test(label+' nega exclusão',async()=>denied(await commit([{delete:path('produtos',id)},sectorChange(s,id,-1)],token)));
 }
});

test('11A vendedor: schema, deltas, remoção, imutabilidade e isolamento',async t=>{
 const a=await signup(),b=await signup(),ea=randomUUID(),eb=randomUUID();
 const path=(c,id)=>`${database}/documents/${c}/${id}`,num=n=>({integerValue:String(n)}),stamp={timestampValue:'2026-10-01T12:00:00Z'};
 const commit=(writes,token=a.token)=>request('POST',':commit',token,{writes});
 const ok=r=>assert.equal(r.status,200,JSON.stringify(r.data));
 ok(await commit(onboarding(a,ea)));ok(await commit(onboarding(b,eb),b.token));
 async function fixture(user=a,est=ea){
  const p=randomUUID(),s=randomUUID(),m=randomUUID(),initial='inicial_'+p;
  const product={id:string(p),estabelecimentoId:string(est),setorId:string(s),nome:string('Produto'),quantidadeInicial:num(20),estoqueAtual:num(20),criadoEm:stamp,status:string('ativo'),inativadoEm:{nullValue:null},inativadoPor:{nullValue:null},possuiHistorico:{booleanValue:true},quantidadeMovimentacoes:num(1),movimentacaoIds:{arrayValue:{values:[string(initial)]}},ultimaMovimentacaoId:string(initial)};
  ok(await commit([{update:{name:path('setores',s),fields:{id:string(s),estabelecimentoId:string(est),nome:string('Setor'),criadoEm:stamp,quantidadeProdutos:num(1),ultimaOperacaoProdutoId:string(p)}}},{update:{name:path('produtos',p),fields:product}},{update:{name:path('movimentacoes',initial),fields:{id:string(initial),estabelecimentoId:string(est),setorId:string(s),produtoId:string(p),tipo:string('entrada'),quantidade:num(20),observacao:string('Estoque inicial'),criadoPor:string(user.uid),criadoEm:stamp}}}],'owner'));
  const transforms=[{fieldPath:'atualizadoEm',setToServerValue:'REQUEST_TIME'}];
  const update=(c,id,fields,mask=Object.keys(fields))=>({update:{name:path(c,id),fields},updateMask:{fieldPaths:mask},updateTransforms:transforms});
  const create=(vendor,tipo='saida')=>[{update:{name:path('movimentacoes',m),fields:{id:string(m),estabelecimentoId:string(est),produtoId:string(p),setorId:string(s),tipo:string(tipo),quantidade:num(4),criadoPor:string(user.uid),...(vendor===undefined?{}:{vendedorNome:vendor})}},updateTransforms:[{fieldPath:'criadoEm',setToServerValue:'REQUEST_TIME'}]},update('produtos',p,{estoqueAtual:num(tipo==='saida'?16:24),quantidadeMovimentacoes:num(2),movimentacaoIds:{arrayValue:{values:[string(initial),string(m)]}},ultimaMovimentacaoId:string(m)})];
  return{p,s,m,initial,create,update};
 }
 for(const [label,value]of [['ausente',undefined],['válido',string('Carlos Henrique')],['80 caracteres',string('A'.repeat(80))]])await t.test('criação saída '+label,async()=>{const f=await fixture();ok(await commit(f.create(value)));const fields=(await request('GET','/movimentacoes/'+f.m,a.token)).data.fields;assert.equal('vendedorNome' in fields,value!==undefined);});
 const invalid=[['vazio',string('')],['espaços',string('   ')],['tabulação',string('\t')],['NBSP',string('\u00a0')],['BOM',string('\ufeff')],['81 caracteres',string('A'.repeat(81))],['espaço inicial',string(' Carlos')],['espaço final',string('Carlos ')],['null',{nullValue:null}],['número',num(1)],['boolean',{booleanValue:true}],['lista',{arrayValue:{values:[string('Carlos')]}}],['mapa',{mapValue:{fields:{nome:string('Carlos')}}}]];
 for(const [label,value]of invalid)await t.test('criação nega vendedor '+label,async()=>{const f=await fixture();denied(await commit(f.create(value)));});
 for(const [label,value]of [['válido',string('Carlos')],['vazio',string('')],['null',{nullValue:null}]])await t.test('entrada nega vendedor '+label,async()=>{const f=await fixture();denied(await commit(f.create(value,'entrada')));});
 await t.test('entrada sem vendedor preservada',async()=>{const f=await fixture();ok(await commit(f.create(undefined,'entrada')));denied(await commit([f.update('movimentacoes',f.m,{vendedorNome:string('Carlos')})]));});
 const f=await fixture();ok(await commit(f.create()));
 await t.test('saída antiga sem vendedor é legível',async()=>ok(await request('GET','/movimentacoes/'+f.m,a.token)));
 for(const nome of ['Carlos Henrique','Joana'])await t.test('edição vendedor '+nome+' sem alteração de saldo',async()=>{ok(await commit([f.update('movimentacoes',f.m,{vendedorNome:string(nome)})]));assert.equal((await request('GET','/produtos/'+f.p,a.token)).data.fields.estoqueAtual.integerValue,'16');});
 for(const [label,value]of invalid)await t.test('edição nega vendedor '+label,async()=>denied(await commit([f.update('movimentacoes',f.m,{vendedorNome:value})])));
 await t.test('remoção real de vendedor sem saldo novo',async()=>{ok(await commit([f.update('movimentacoes',f.m,{},['vendedorNome'])]));assert.equal('vendedorNome' in (await request('GET','/movimentacoes/'+f.m,a.token)).data.fields,false);assert.equal((await request('GET','/produtos/'+f.p,a.token)).data.fields.estoqueAtual.integerValue,'16');});
 await t.test('quantidade e vendedor exigem delta atômico',async()=>{const w=f.update('movimentacoes',f.m,{quantidade:num(6),vendedorNome:string('Carlos')});denied(await commit([w]));ok(await commit([w,f.update('produtos',f.p,{estoqueAtual:num(14),ultimaMovimentacaoId:string(f.m)})]));assert.equal((await request('GET','/produtos/'+f.p,a.token)).data.fields.estoqueAtual.integerValue,'14');});
 await t.test('vendedor não autoriza alterar tipo nem saldo',async()=>{denied(await commit([f.update('movimentacoes',f.m,{tipo:string('entrada'),vendedorNome:string('Carlos')})]));denied(await commit([f.update('movimentacoes',f.m,{vendedorNome:string('Outro')}),f.update('produtos',f.p,{estoqueAtual:num(15),ultimaMovimentacaoId:string(f.m)})]));});
 await t.test('whitelist não permite dados pessoais adicionais',async()=>{denied(await commit([f.update('movimentacoes',f.m,{vendedorEmail:string('extra@example.test')})]));});
 const other=await fixture(b,eb);ok(await commit(other.create(string('Vendedor B')),b.token));
 for(const [label,token,target]of [['B não lê/edita A',b.token,f],['A não lê/edita B',a.token,other],['anônimo',null,f]])await t.test(label,async()=>{denied(await request('GET','/movimentacoes/'+target.m,token));denied(await commit([target.update('movimentacoes',target.m,{vendedorNome:string('Ataque')})],token));});
 for(const [label,changes]of [['ativo sem histórico',{possuiHistorico:{booleanValue:false},quantidadeInicial:num(0),estoqueAtual:num(0),quantidadeMovimentacoes:num(0),movimentacaoIds:{arrayValue:{values:[]}}}],['com histórico',{}],['inativo',{status:string('inativo'),inativadoEm:stamp,inativadoPor:string(a.uid)}]])await t.test('delete produto negado '+label,async()=>{const p=await fixture();if(Object.keys(changes).length)ok(await commit([p.update('produtos',p.p,changes)],'owner'));denied(await request('DELETE','/produtos/'+p.p,a.token));denied(await commit([{delete:path('produtos',p.p)},p.update('setores',p.s,{quantidadeProdutos:num(0),ultimaOperacaoProdutoId:string(p.p)})]));denied(await request('DELETE','/setores/'+p.s,a.token));});
});

test('11B concorrência com vendedor e precondições reais no Firestore Emulator', async t => {
 const user=await signup(),est=randomUUID(),sector=randomUUID();
 assert.equal((await request('POST',':commit',user.token,{writes:onboarding(user,est)})).status,200);
 const num=n=>({integerValue:String(n)}),path=(c,id)=>`${database}/documents/${c}/${id}`,stamp={timestampValue:'2026-10-13T12:00:00Z'};
 const commit=(writes,token=user.token)=>request('POST',':commit',token,{writes});
 async function seed(stock=10,withExit=false){
  const p=randomUUID(),initial='inicial_'+p,m=randomUUID(),ids=withExit?[initial,m]:[initial];
  const writes=[{update:{name:path('setores',sector),fields:{id:string(sector),nome:string('11B'),estabelecimentoId:string(est),criadoEm:stamp,quantidadeProdutos:num(1)}}},
   {update:{name:path('produtos',p),fields:{id:string(p),nome:string('11B'),estabelecimentoId:string(est),setorId:string(sector),quantidadeInicial:num(withExit?20:stock),estoqueAtual:num(stock),status:string('ativo'),inativadoEm:{nullValue:null},inativadoPor:{nullValue:null},possuiHistorico:{booleanValue:true},criadoEm:stamp,quantidadeMovimentacoes:num(ids.length),movimentacaoIds:{arrayValue:{values:ids.map(string)}},ultimaMovimentacaoId:string(ids.at(-1))}}},
   {update:{name:path('movimentacoes',initial),fields:{id:string(initial),estabelecimentoId:string(est),produtoId:string(p),setorId:string(sector),tipo:string('entrada'),quantidade:num(withExit?20:stock),criadoPor:string(user.uid),criadoEm:stamp,observacao:string('Estoque inicial')}}}];
  if(withExit)writes.push({update:{name:path('movimentacoes',m),fields:{id:string(m),estabelecimentoId:string(est),produtoId:string(p),setorId:string(sector),tipo:string('saida'),quantidade:num(5),vendedorNome:string('A'),criadoPor:string(user.uid),criadoEm:stamp}}});
  assert.equal((await commit(writes,'owner')).status,200);return{p,m};
 }
 const read=async(c,id)=>{const r=await request('GET','/'+c+'/'+id,user.token);assert.equal(r.status,200);return r.data;};
 const update=(col,id,data,time)=>({update:{name:path(col,id),fields:data},updateMask:{fieldPaths:Object.keys(data)},updateTransforms:[{fieldPath:'atualizadoEm',setToServerValue:'REQUEST_TIME'}],...(time?{currentDocument:{updateTime:time}}:{})});
 async function exit(p,qty,vendor){
  const id=randomUUID();
  for(let retry=0;retry<5;retry++){
   const doc=await read('produtos',p),d=doc.fields,stock=Number(d.estoqueAtual.integerValue);if(stock<qty)return{status:409,insufficient:true};
   const ids=d.movimentacaoIds.arrayValue.values||[],n=Number(d.quantidadeMovimentacoes.integerValue);
   const writes=[{update:{name:path('movimentacoes',id),fields:{id:string(id),estabelecimentoId:string(est),produtoId:string(p),setorId:string(sector),tipo:string('saida'),quantidade:num(qty),vendedorNome:string(vendor),criadoPor:string(user.uid)}},updateTransforms:[{fieldPath:'criadoEm',setToServerValue:'REQUEST_TIME'}],currentDocument:{exists:false}},update('produtos',p,{estoqueAtual:num(stock-qty),quantidadeMovimentacoes:num(n+1),movimentacaoIds:{arrayValue:{values:ids.length<6?[...ids,string(id)]:ids}},ultimaMovimentacaoId:string(id),possuiHistorico:{booleanValue:true}},doc.updateTime)];
   const r=await commit(writes);if(r.status===200)return r;if(r.status===403 && (await read('produtos',p)).updateTime!==doc.updateTime)continue;if(r.status!==409)throw Error(JSON.stringify(r));
  }throw Error('Retry excedido');
 }
 async function editQuantity(f,qty,vendor){
  for(let retry=0;retry<5;retry++){
   const[p,m]=await Promise.all([read('produtos',f.p),read('movimentacoes',f.m)]),stock=Number(p.fields.estoqueAtual.integerValue),old=Number(m.fields.quantidade.integerValue);
   const r=await commit([update('movimentacoes',f.m,{quantidade:num(qty),vendedorNome:string(vendor)},m.updateTime),update('produtos',f.p,{estoqueAtual:num(stock+old-qty),ultimaMovimentacaoId:string(f.m)},p.updateTime)]);
   if(r.status===200)return r;if(r.status===403 && (await read('produtos',f.p)).updateTime!==p.updateTime)continue;if(r.status!==409)throw Error(JSON.stringify(r));
  }throw Error('Retry excedido');
 }
 await t.test('duas saídas8/7 com vendedor em saldo10: somente uma confirma',async()=>{const f=await seed(10);const results=await Promise.all([exit(f.p,8,'A'),exit(f.p,7,'B')]);assert.equal(results.filter(r=>r.status===200).length,1);const p=await read('produtos',f.p);assert.ok([2,3].includes(Number(p.fields.estoqueAtual.integerValue)));});
 await t.test('editar só vendedor em paralelo com saída conserva delta',async()=>{const f=await seed(15,true);const results=await Promise.all([commit([update('movimentacoes',f.m,{vendedorNome:string('B')})]),exit(f.p,3,'Outro')]);assert.ok(results.every(r=>r.status===200));assert.equal((await read('produtos',f.p)).fields.estoqueAtual.integerValue,'12');assert.equal((await read('movimentacoes',f.m)).fields.vendedorNome.stringValue,'B');});
 await t.test('editar quantidade5→7 e vendedor enquanto sai3: saldo10',async()=>{const f=await seed(15,true);const results=await Promise.all([editQuantity(f,7,'C'),exit(f.p,3,'Outro')]);assert.ok(results.every(r=>r.status===200));assert.equal((await read('produtos',f.p)).fields.estoqueAtual.integerValue,'10');assert.equal((await read('movimentacoes',f.m)).fields.vendedorNome.stringValue,'C');});
});
