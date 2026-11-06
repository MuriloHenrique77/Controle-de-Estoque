# Validação da Etapa 8 — Relatórios — 05/10/2026

As evidências complementares desta validação integram o acervo interno do projeto.

## Cenário real no Android

Development build Android existente (`com.murilo.estoqueporsetores`), Metro com
código atualizado, emulador Pixel 6 API 36 configurado em **360 × 740 dp**, densidade
160. Nenhuma dependência ou alteração nativa exigiu recompilação da build.
Dois usuários e estabelecimentos temporários, identificados como TESTE ETAPA 8,
foram usados com Firebase Authentication/Firestore do projeto correto.

Fixture A: setor A com produto A (inicial 10, entrada 5, saídas 4 e 2, mínimo 5)
e B (inicial 0, mínimo 5); setor B com produto C (inicial 12, saída 7, mínimo 12).
Fixture B: outro estabelecimento, produto exclusivo (inicial 100, saída 3).
Nomes longos de setor/produto C conferidos na rolagem e no seletor.

| Cenário | Entradas | Saídas | Saldo do período | Movimentos |
| --- | ---: | ---: | ---: | ---: |
| A sem filtros adicionais | 27 | 13 | 14 | 6 |
| A somente setor A | 15 | 6 | 9 | 4 |
| A setor A + produto A | 15 | 6 | 9 | 4 |
| A setor A + produto A + entrada | 15 | 0 | 15 | 2 |
| A somente entrada | 27 | 0 | 27 | 3 |
| A somente saída | 0 | 13 | -13 | 3 |
| A somente produto C, sem setor | 12 | 7 | 5 | 2 |
| A dia 04/10, sem movimentos | 0 | 0 | 0 | 0 |
| A após entrada adicional 1, ao vivo | 28 | 13 | 15 | 7 |
| B após logout A → login B | 100 | 3 | 97 | 2 |
| A após logout B → login A | 28 | 13 | 15 | 7 |

Fixture inicial A: dois produtos distintos movimentados; maior entrada A = 15,
maior saída C = 7; B sem movimentação no período; B (atual 0/mínimo 5) e C
(atual 5/mínimo 12) em reposição; somente B com estoque zerado. Totais por setor:
A = 15/6, B = 12/7. As seis linhas do histórico foram alcançadas por rolagem.
Uma entrada adicional em commit autorizado pelo usuário A atualizou o relatório
enquanto aberto, sem reinício. Detalhes abertos pelo ranking mostraram estoque A
10, diferente do saldo 15 do período. O sétimo registro e a entrada inicial
continuaram acessíveis na rolagem.

Período reverso (05/10–04/10) rejeitado com mensagem explícita. Período aplicado
permanece separado dos campos em edição. Aplicar 04/10 retornou estado vazio
e métricas zero. Campos foram editados usando o teclado nativo.

Sem Wi-Fi/dados, os totais 28/13/15 e sete movimentos em cache permaneceram
visíveis. Aviso informa que dados podem estar desatualizados/incompletos. Rede
restaurada antes da troca de contas. Não foi criado cache paralelo.

Em B, percurso por todas as seções mostrou somente produto exclusivo de B, sem
produtos A/C. Retorno a A restituiu suas métricas e não mostrou produto exclusivo
de B. Teste automatizado do hook verifica também a janela **antes dos efeitos**:
render da nova sessão não devolve dados antigos; callback após cleanup é ignorado.
Essa prova de estado complementa a inspeção visual; não constitui análise de cada
frame do compositor Android.

## Testes e segurança

- TypeScript: `npx.cmd tsc --noEmit` — PASS.
- Expo Doctor: 18/18 checks — PASS.
- Lógica/serviços: **64 testes**, zero falhas, incluindo **18 novos testes** de
  agregação, intervalo, consultas, metadata, erros, sessão, foco e retry.
- Rules Emulator: **445 testes**, zero falhas; 28 cenários adicionais da Etapa 8.
- `git diff --check`: PASS; verificação adicional de whitespace nos novos arquivos.
- Sem `any`, `as never`, escrita Firestore ou cache paralelo no módulo.

Agregação testa 10+5, 4+2 e saldo 9; soma por produto/rankings; empates por nome/ID;
sem movimento A/C → B; mínimo atual 4/5/6 versus 5; mínimo ausente; zero; filtro
setor/produto/tipo/período; reposição independente de período/tipo; overflow e
mistura de estabelecimentos. Intervalo testa calendário inválido, ano bissexto,
dia inicial inclusive, último milissegundo, dia seguinte exclusivo, São Paulo,
Tóquio e DST de Nova York (dias com 23/25 horas).

Serviço testa exatamente três queries com estabelecimento no servidor, range e
ordenação; espera das três fontes; metadata cache; erro distinto de vazio;
cleanup idempotente inclusive erro síncrono de aquisição; rejeição de documento
inválido e callback de usuário antigo. Hook testa blur, troca de período/sessão,
retry e bloqueio no render antes do cleanup.

Rules executam as queries efetivas de produtos/setores e movimentos com range e
ordem descendente: A lê A, B lê B; A→B, B→A, anônimo e usuário sem perfil negados;
query sem estabelecimento negada; setor/produto de B não autoriza leitura de B nem
substitui o escopo obrigatório. Último dia inclui `23:59:59.999999` local, exclui
início do dia seguinte. Bypass `owner` é usado exclusivamente no emulador para
preparar fixtures dos testes de leitura, protegido por host local/projeto demo.
Fixtures Android foram criadas por commits autenticados sujeitos às Rules.

`firestore.rules` **não foi modificado nem publicado nesta etapa**. Auditoria de
Rules não foi necessária: nenhuma permissão de leitura/escrita foi alterada.
SHA-256 do arquivo preservado:
`425624106807ACF7009AEC86B93F6CCBED1CBA5097FD125710AC4D757A7E0C5E`.
Protocolo de movimentações, concorrência e cascade de seis preservados.

## Índice e performance

Único índice: `movimentacoes`, COLLECTION, `estabelecimentoId ASC`, `criadoEm DESC`,
`__name__ DESC` implícito. Declarado em `firestore.indexes.json` e referenciado em
`firebase.json`. Deploy **somente firestore:indexes** no projeto
`controle-de-estoque---tcc`, base `(default)`. Confirmado READY pelo Admin API:
`projects/controle-de-estoque---tcc/databases/(default)/collectionGroups/movimentacoes/indexes/CICAgOjXh4EK`.

Três listeners fixos enquanto Relatórios está focado, com cleanup; sem leitura por
linha. Mapas para juntar produto/setor e agregação client-side do conjunto seguro.
Filtros opcionais locais evitam multiplicar índices. A lista virtualiza as linhas,
mas esta versão mantém todo o período e os produtos/setores em memória. Volume
muito grande requer evolução futura sem truncar as métricas. Detalhes completos
em [ARQUITETURA.md](ARQUITETURA.md#etapa-8--relatórios).

## Inventário desta etapa

Criados:

- `src/types/relatorio.types.ts`
- `src/utils/periodoRelatorio.ts`
- `src/utils/relatorios.ts`
- `src/utils/formatarRelatorio.ts`
- `src/services/relatorios/relatoriosService.ts`
- `src/services/relatorios/relatoriosService.web.ts`
- `src/services/relatorios/useRelatorios.ts`
- `src/components/FiltroSelecao.tsx`
- `src/screens/relatorios/RelatoriosScreen.tsx`
- `tests/relatorios.test.cjs`
- `firestore.indexes.json`
- `docs/VALIDACAO_ETAPA_8.md` e capturas `docs/validacoes/etapa8-*.png`.

Modificados: `src/navigation/types.ts`, `src/navigation/StockNavigator.tsx`,
`src/screens/setores/SetoresScreen.tsx`, `tests/firebase-rules.test.cjs`,
`firebase.json`, `README.md`, `docs/ARQUITETURA.md`.
Nenhum arquivo preexistente removido nesta etapa. Alterações anteriores do
workspace preservadas; nenhum commit e nenhuma etapa seguinte iniciada.

## Evidências visuais

- Filtros
- Resumo 27/13/14
- Rankings e nome longo
- Filtro de setor
- Filtros combinados
- Período inválido
- Período vazio
- Tempo real 28/13/15
- Aviso offline
- Resumo estabelecimento B
- Movimentos exclusivos de B
- Retorno ao estabelecimento A
- Reposição e estoque zerado
- Movimentos de A até entrada inicial
- Teclado nativo

## Encerramento

**ETAPA 8 APROVADA TECNICAMENTE.** Nenhuma pendência nova bloqueia a etapa.
Limitações previamente aprovadas permanecem: Firebase nativo indisponível na web
e cascade até seis. Períodos muito extensos carregam todos os registros em memória.

Produtos e histórico de cada fixture foram removidos por cascade autenticado,
respeitando o limite, seguido da exclusão de setores vazios. Queries autenticadas
confirmaram zero setores/produtos/movimentos de A e B antes da remoção dos perfis.
Perfis e estabelecimentos temporários foram removidos administrativamente;
releituras confirmaram `not found` nos quatro caminhos. Firebase Auth confirmou
`users: []` para ambos os UIDs após remoção das contas. Arquivo temporário de
credenciais removido. Rede, tamanho e densidade restaurados, aplicativo deslogado.
Verificações de TypeScript e whitespace concluídas. Nenhum commit.
