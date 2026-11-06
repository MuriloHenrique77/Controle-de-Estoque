# Etapa 10A — checkpoint, identidade, navegação e Home

Data: 06/10/2026. Resultado: **ETAPA 10A APROVADA**.

## Checkpoint

Antes de qualquer alteração desta etapa, foram executados e aprovados:
TypeScript, Expo Doctor 18/18, 73 testes de lógica/serviços, 446 testes de Rules
e `git diff --check`. O `git status --short` foi registrado na execução: havia
alterações do MVP, remoções do protótipo anterior e arquivos das etapas aprovadas
ainda sem commit. Nenhum arquivo da evolução visual existia no checkpoint.

Commit: `506344fe50bf3c203870a937bf225c03ea3c47b7`.

Mensagem: `checkpoint: MVP aprovado antes da evolução visual`.

O status ficou limpo após o commit. A Etapa 10A permanece sem commit para revisão.
Os cinco testes da recuperação de senha já aprovada integram os 73 do checkpoint.

## Design System e Inter

Tokens em `src/theme`: paleta aprovada, espaçamentos, tipografia, raios e sombra
leve. Novas telas usam fundo `#F7F8FA`, superfície branca, apoio `#DCE8F4`, ação
`#456A8C`, texto `#25313C`, texto secundário `#66727C` e borda `#E5E9EC`.
Estados de atenção usam cores sóbrias e texto explícito.

Inter regular, medium, semibold e bold: arquivos locais do pacote, incorporados
pela configuração do `expo-font`. O carregamento bloqueia as telas até as fontes
estarem prontas, com indicador e mensagem de erro sem flash de outra tipografia.
A build Android foi recompilada e instalada. Expo SDK 54 foi preservado.

Referências oficiais: [Expo Font SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/font/)
e [React Navigation Bottom Tabs](https://reactnavigation.org/docs/bottom-tab-navigator/).

## Componentes

- `AppScreen`: rolagem única ou área para lista, safe areas laterais e teclado.
- `AppCard`: superfície com borda e raio consistentes.
- `AppButton`: variantes primary, secondary, danger e text; loading e toque mínimo de 48 dp.
- `AppInput`: label, campo e erro consistente.
- `EmptyState`, `LoadingState`, `ErrorState`: orientação, carregamento e retry.
- `SectionHeader` e `StatusBadge`: organização e atenção por texto.
- `FeedbackProvider`/`useFeedback`: snackbar com sucesso, expiração e botão de fechar.
- `MovimentoCard`: produto, setor, sinal/tipo, quantidade, data/hora e acesso aos detalhes.

Formulários compartilhados e logout adotaram tokens. A confirmação destrutiva
existente foi preservada. O sucesso de criar/editar setor passou a snackbar após
a confirmação do Firestore. O snackbar foi observado no Android e expirou
automaticamente; a captura ocorreu antes da expiração.

## Navegação

Início, Estoque, Movimentações e Relatórios são as quatro abas autenticadas.
O stack de Estoque mantém Setores → Produtos → Detalhes e os formulários existentes.
Relatórios é registrado uma única vez; apenas sua integração de navegação mudou
para abrir os detalhes no stack de Estoque. Filtros, cálculos e serviços permanecem iguais.

Atalhos da Home abrem seleção pesquisável: setor para novo produto, produto para
entrada/saída. Usam os formulários e serviços atuais, sem duplicar regras.
A barra usa safe area, não é sobreposta ao conteúdo e se oculta durante o teclado.
Rótulos permanecem completos na largura de 360 dp.

## Home e consultas

Métricas: totalProdutos, totalSetores, totalReposicao e totalZerados. “Produtos”
representa os cadastros atuais; nenhum campo ativo/inativo foi criado.
Reposição reutiliza `precisaReposicao`, inclusive igualdade e mínimo zero.
Zero é contado separadamente, inclusive quando não há mínimo.

A Home deriva os totais dos produtos/setores existentes, usando a projeção de
estoque já aprovada, mantida pelas transações atuais. Não grava totais nem modifica
o saldo ou o histórico. Não recalcula o saldo usando apenas os cinco movimentos.
“Atenção” aparece somente quando há situações relevantes. Recentes traz cinco
movimentos; ações rápidas têm destinos funcionais.

São três consultas por tela, com `where('estabelecimentoId', '==', sessão.estabelecimentoId)`:
produtos, setores e movimentações. Home limita movimentos a cinco. A visão global
começa em 50 e permite carregar mais em incrementos de 50. Não há consultas por
produto ou por linha. Conversores existentes validam vínculos e documentos.

O índice existente `movimentacoes: estabelecimentoId ASC, criadoEm DESC` está
`READY` no projeto. Não houve alteração ou publicação de índices/Rules.
Listeners encerram em blur, mudança de contexto/limite, erro e desmontagem.
Dados antigos são bloqueados no render antes dos efeitos, e callbacks tardios
não publicam dados após cleanup. Estado de cache é informado na interface.

## Android e responsividade

Pixel_6_API_36, development build de `com.murilo.estoqueporsetores`:

| Verificação | Resultado |
| --- | --- |
| Login → Home | PASS |
| Home → Estoque → Setores → Produtos → Detalhes → voltar | PASS |
| Home → Movimentações, entrada/saída com texto e sinal | PASS |
| Home → Relatórios, totais e detalhes pelo relatório | PASS |
| Trocas repetidas entre as quatro abas | PASS |
| Novo produto, Entrada e Saída pelos atalhos | PASS |
| Busca e teclado na seleção | PASS |
| Snackbar após confirmação do Firestore | PASS |
| Conta A → B → A, sem dados anteriores | PASS |
| 360×740 e 411×891, rolagem e conteúdo acessível | PASS |
| Inter, paleta, cards e rótulos da barra | PASS |

Dados A: três produtos, dois setores, dois para reposição e um zerado. Após criar
um setor temporário na interface, a Home refletiu três setores. B: um produto,
um setor, zero para reposição e zero zerados, sem seção de atenção vazia.
Movimentos de B exibiram apenas seu produto, com saída -3 e entrada +100.
Relatórios de A conservaram entradas 27 e saídas 13.

O emulador permaneceu visível no monitor principal, à direita, sem Android Studio
ou segundo AVD. Posição confirmada: janela 440×750, X=1066, Y=60; totalmente
dentro da área útil 1536×816. ADB confirmou `device` e boot `1`.
Resolução, densidade e ajuste temporário do teclado foram restaurados ao terminar.
Contas, perfis, estabelecimentos, setores, produtos e movimentos de teste foram
removidos; ausência do estoque e das contas Auth foi confirmada.

## Testes

- TypeScript: PASS.
- Expo Doctor: 18/18 PASS.
- Lógica/serviços: 80/80 PASS, sete novos testes.
- Rules Emulators: 446/446 PASS.
- `git diff --check` e verificação dos novos arquivos: PASS.
- Build Android: PASS.

Novos testes: agregações/vazio/mínimo, isolamento, ordenação e associações sem N+1,
três consultas/limit/cache, cleanup idempotente, erros/documentos inválidos,
aquisição síncrona, callbacks de outra conta e hook em blur/limite/sessão/retry.
Testes existentes foram preservados. Auditor de Rules não necessário: Rules não alteradas.

Rastreabilidade principal: RF-04, RF-08, RF-09, RF-14, RF-17 e RF-22 na integração;
RN-03, RN-12 e RN-14 preservadas; RNF-01–03, RNF-05–08 e RNF-11–16 na interface,
responsividade, isolamento, desempenho e organização.

## Dependências

Adicionadas: `@react-navigation/bottom-tabs@7.15.11` e `@expo-google-fonts/inter@0.4.2`.
Nenhuma dependência direta removida. `expo-font` já existia. React Navigation Native
foi fixado na versão existente 7.2.2; override de Elements 2.9.14 preserva a versão
já usada pelo stack e evita atualização incidental ao instalar as abas.
Não houve atualização de Expo, Firebase, React Native ou migração para Expo Router.

## Arquivos

Modificados:

- `App.tsx`, `README.md`, `app.json`, `package.json`, `package-lock.json`.
- `src/components/AuthFormLayout.tsx`, `src/components/LogoutButton.tsx`.
- `src/navigation/RootNavigator.tsx`, `StockNavigator.tsx`, `types.ts`.
- `src/screens/relatorios/RelatoriosScreen.tsx` (somente integração de navegação).
- `src/screens/setores/SetorFormScreen.tsx`, `SetoresScreen.tsx`.
- `src/styles/setoresScreen.styles.ts` (tokens e tipografia; estrutura preservada).

Criados:

- `src/theme/colors.ts`, `spacing.ts`, `typography.ts`, `radii.ts`, `shadows.ts`, `index.ts`, `navigation.ts`.
- `src/components/ui/AppScreen.tsx`, `AppCard.tsx`, `AppButton.tsx`, `AppInput.tsx`.
- `src/components/ui/ScreenState.tsx`, `SectionHeader.tsx`, `StatusBadge.tsx`, `FeedbackProvider.tsx`.
- `src/components/MovimentoCard.tsx`.
- `src/navigation/AuthenticatedNavigator.tsx`.
- `src/screens/home/HomeScreen.tsx`.
- `src/screens/movimentacoes/MovimentacoesScreen.tsx`.
- `src/screens/setores/SelecaoEstoqueScreen.tsx`.
- `src/services/visaoEstoque/visaoEstoqueService.ts`, `visaoEstoqueService.web.ts`, `useVisaoEstoque.ts`.
- `src/types/visaoEstoque.types.ts`, `src/utils/visaoEstoque.ts`.
- `tests/visao-estoque.test.cjs` e este documento.
- Evidências `docs/validacoes/etapa10a-*.png`: login; Home 360/411; setores/estoque
  360/411; produtos/detalhes; movimentos 360/411; relatórios 360/411/resumo/detalhes;
  três atalhos; teclado; snackbar; Home/movimentos B; retorno A.

Removidos nesta etapa: nenhum arquivo.

## Limites do escopo

Setores continua apenas com cards de setores, sem produtos expandidos ou alertas
de produto. Produtos/relatórios não receberam redesign completo. Produtos normais
continuam sem badge verde ou “Tudo certo”. Segurança, cascade, projeção/transações,
concorrência, modelo de movimentação, SessionProvider e serviços existentes não
foram refatorados. Recuperação de senha previamente aprovada foi preservada;
seus arquivos não mudaram, apenas estilos compartilhados receberam a identidade.
Produtos inativos, Cloud Functions, exportações e Firebase iOS/Web não foram iniciados.

Pendências desta etapa: nenhuma. As limitações anteriores do MVP continuam
documentadas em `AUDITORIA_FINAL_MVP.md`.
