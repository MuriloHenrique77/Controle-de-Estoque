# Etapa 11A — features da futura Setority 1.1.0

As evidências complementares desta validação integram o acervo interno do projeto.

Datas de execução: 12–13/10/2026. Branch: `codex/etapa-11a`. Nenhum release ou bump de versão nesta etapa.

## Referência histórica e baseline

A árvore inicial não estava limpa: continha as mudanças aprovadas da 1.0.0 ainda sem commit. O usuário autorizou expressamente o checkpoint e a tag. Antes de implementar a 11A, foram criados o commit `417e401b9a21fded7544118c631c85a6cc8cbe17` e a tag anotada `v1.0.0`; `git status --short` ficou vazio. O HEAD anterior `f8ae9d1` não incluía todas as fontes usadas no APK.

`docs/RELEASE_1.0.0.md` registra o comportamento histórico. O APK `release/Setority-v1.0.0.apk` foi preservado com SHA-256 `607afd095119335258a714b8fe0c4ea2c63d2645e9aa2f14c55b56bf64549c11`. A tag e o checkpoint não foram reescritos. As mudanças da 11A não foram commitadas.

Baseline antes das alterações:

| Verificação | Resultado |
|---|---|
| TypeScript | PASS |
| Expo Doctor | 18/18 PASS |
| Lógica/serviços | 100/100 PASS |
| Rules Emulator | 500/500 PASS |
| git diff --check | PASS |

## Mudanças

### Home

Removida a seção de movimentações recentes e seus elementos associados, sem conteúdo substituto ou espaço artificial. Indicadores, alertas, ações rápidas existentes `Novo produto`, `Entrada` e `Saída`, estilo e navegação preservados.

A Home usa `useVisaoEstoque(0)`: somente duas consultas isoladas por estabelecimento, produtos e setores. Saldo/reposição continuam derivados da projeção transacional existente. Não há listener/query de recentes em background. Limites positivos continuam habilitando histórico global ordenado/paginado na aba Movimentações. Cleanup idempotente, foco, mudança de sessão, retry e estados de cache preservados e testados.

### Produtos

Removidos `removerProduto`, a implementação de transação de delete, a API web correspondente, `validarExclusaoPermanente`, mensagens de elegibilidade, ação/modais/callbacks de exclusão da UI. Produto ativo/inativo/legado/sem histórico não tem caminho público de exclusão permanente.

Mantidos edição, inativação, reativação, histórico, estoque e exclusão individual de movimentação conforme regras anteriores. `possuiHistorico` segue compatível e irreversível; não houve migração, limpeza de marcadores ou alteração em documentos antigos. RN08 continua bloqueando exclusão de setor com produtos ativos ou inativos.

### vendedorNome

Campo canônico opcional `vendedorNome?: string`, permitido somente em saída. Checkbox acessível `Adicionar vendedor`, desmarcado por padrão, com role checkbox, checked/disabled, label clicável e alvo de 44dp. Quando marcado, `AppInput` existente mostra `Nome do vendedor`, teclado normal e exige nome após trim, com até 80 caracteres e capitalização preservada.

Quando desmarcado, campo omitido na criação; na edição, `deleteField()` modular do React Native Firebase remove o campo efetivamente. Entrada não mostra checkbox e seu contrato de serviço não aceita vendedor. A validação runtime também rejeita vendedor em entrada. Sem string vazia, null, ignoreUndefinedProperties ou configurações globais novas.

Conversor aceita saídas antigas sem o campo. Exibição compartilhada por `VendedorLinha`, omitindo a linha quando ausente, em histórico do produto, `MovimentoCard` global e linha de movimentação já existente no relatório. Edição inicializa checkbox/nome de saída existente. Sem coleção, IDs de vendedor, filtro, ranking, seção nova ou cálculo comercial.

Transações e releituras preservadas. Editar somente vendedor não escreve no produto; quantidade mais vendedor aplica exclusivamente o delta existente. Não há novas queries ou índices.

## Rules e auditoria

`produtos`: delete sempre `false`. Eliminada a permissão de decrementar contador de setor por delete de produto. Criação, leitura, edição, ciclo e isolamento mantidos.

`movimentacoes`: whitelist inclui `vendedorNome`; `validVendor` aplicado à criação manual e edição. Nome, quando presente, exige saída, string de 1 a 80 caracteres, sem whitespace nas pontas. Entrada inicial mantém whitelist sem vendedor. Tipo, autor, vínculos e criadoEm permanecem imutáveis. Delete individual e deltas de estoque mantêm suas garantias anteriores.

Rules Emulator: **547/547 PASS**. Os 500 cenários existentes foram mantidos, atualizando apenas expectativas dependentes da antiga exclusão de produto; adicionados 47 cenários para vendedor, remoção, deltas, schema, isolamento e deletes negados. A expectativa antiga de query com dois produtos foi atualizada para três, pois o produto de teste não é mais excluído.

Auditor: **5/5 no escopo examinado**, sem bypass crítico observado. Relatório em `AUDITORIA_RULES_ETAPA_11A.json`; resultado não equivale a prova exaustiva de segurança. Compilação remota `firebase deploy --only firestore:rules --dry-run --project controle-de-estoque---tcc`: PASS antes da publicação autorizada.

## Validações locais

- TypeScript: PASS.
- Expo Doctor: 18/18 PASS.
- Lógica/serviços/UI: 124/124 PASS.
- Rules Emulator: 547/547 PASS.
- Auditor: 5/5 no escopo examinado.
- `git diff --check`: PASS após remoção de novas linhas vazias no fim de três arquivos.

Testes exercitam trim, capitalização, ausências, branco/Unicode, tipos inválidos, 80/81 caracteres, entrada proibida, criação/adição/edição/remoção, saldo inalterado sem mudança de quantidade, delta conjunto, reavaliação concorrente, offline sem sucesso falso, troca de sessão e isolamento A/B. Testes de UI exercitam Home e ações rápidas, produto ativo/inativo sem exclusão, checkbox acessível, formulário condicional, edição inicializada e exibição sem placeholders. Cálculos/rankings dos relatórios são invariantes ao vendedor.

## Android e responsividade

Pixel_6_API_36 iniciado pelo terminal, sem Android Studio, janela visível dentro do monitor principal e posicionada em `1066,60,1506,810`; `adb devices` confirmou `device` e boot `1`.

Tentativa de reutilizar o development build já existente (sem gerar APK novo): o binário contém apenas ARM64/ARMv7. Instalação aceita pelo emulador, mas inicialização falha antes do JavaScript com `SoLoaderDSONotFoundError: libreactnative.so`, pois o ambiente é x86_64 e o loader procura essa ABI. Isso impede executar o E2E das features com esse binário.

O usuário autorizou expressamente a exceção para um development build local x86_64. `gradlew :app:assembleDebug -PreactNativeArchitectures=x86_64` concluiu com sucesso em aproximadamente três minutos. O teste usa esse development build com Metro e as fontes da 11A; não é validação do APK release histórico. Nenhum APK release ou AAB foi gerado.

Executados no aplicativo, em 360×740 e 411×891: cadastro/onboarding sintéticos, logout/login, Home sem recentes, criação de setor/produto, inativação/reativação, ausência de exclusão permanente, saída sem vendedor, checkbox, nome vazio/espaços/81 caracteres bloqueados, trim e capitalização, edição/remoção/adição de vendedor, delta de quantidade, entrada sem vendedor, histórico do produto/global, relatórios e ações rápidas. Nome de 80 caracteres completo com quebra de linha, sem truncamento. O limite é validado após trim; nome de 80 caracteres com espaços nas pontas foi aceito e persistido sem esses espaços.

Estoque observado: entrada inicial 20; duas saídas de 4 deixam 12; editar somente vendedor e removê-lo mantém 12; alterar uma saída de 4 para 3 deixa 13; nova saída de 1 deixa 12. Conferência direta dos documentos confirma ausência real do campo quando desmarcado e nomes de 80 caracteres quando presentes. Relatório final: entradas 20, saídas 8, saldo do período 12, quatro movimentações, um produto movimentado. Compatibilidade com movimentações anteriores sem vendedor também validada.

Teclado, rolagem e acesso aos botões conferidos; em 411×891 o botão Confirmar saída fica completamente acima do teclado aberto após rolar o conteúdo. O formulário dessa conferência foi cancelado, mantendo saldo 12 e quatro movimentos. Evidências em `docs/validacoes/etapa11a-*.png`. Na retomada de 13/10 houve aviso temporário de System UI não respondendo; selecionar Wait recuperou o emulador. Não foi necessária mudança de código para esse aviso.

Após logout, removidos exclusivamente os dados do estabelecimento sintético verificado: quatro movimentações, produto, setor, perfil, estabelecimento e usuário Auth. Verificada ausência posterior; credenciais temporárias apagadas. Nenhum dado real foi modificado pela limpeza. Resolução física 1080×2400, densidade 420 e configuração de handwriting restauradas; janela permanece visível dentro do monitor principal. Nenhum erro fatal ou ReactNativeJS Error no log examinado do PID atual.

## Deploy e pendências

Deploy autorizado e concluído em 12/10/2026 às 13:16:29 UTC, exclusivamente `firestore:rules`, após testes locais e auditoria. Auth, indexes, Hosting, Storage e Functions não foram alterados.

Verificação em 13/10: fonte das Rules ativas igual à local (normalização CRLF), SHA-256 `79eee65056192429da1b2cbcc677328010bcd0fcdcfd8cb03d4762706ff44b32`, ruleset `fdb2eab8-b243-4cf9-aa96-4f437fbc7824`. Cliente normal autenticado: leitura do próprio produto 200, tentativa de delete 403, nova leitura 200; produto preservado.

## Arquivos

Criados:

- `CHANGELOG.md`
- `docs/VALIDACAO_ETAPA_11A.md`
- `docs/AUDITORIA_RULES_ETAPA_11A.json`
- `src/components/ui/AppCheckbox.tsx`
- `src/components/ui/VendedorLinha.tsx`
- `tests/features-11a-ui.test.cjs`
- `tests/vendedor.test.cjs`
- 13 capturas em `docs/validacoes/etapa11a-*.png`, detalhadas abaixo.

Alterados:

- `firestore.rules`
- `src/components/MovimentoCard.tsx`
- `src/components/ProdutoLifecycleActions.tsx`
- `src/screens/home/HomeScreen.tsx`
- `src/screens/relatorios/RelatoriosScreen.tsx`
- `src/screens/setores/MovimentacaoFormScreen.tsx`
- `src/screens/setores/ProdutoDetalhesScreen.tsx`
- `src/services/firebase/converters/movimentacao.ts`
- `src/services/movimentacoes/movimentacoesService.ts`
- `src/services/movimentacoes/movimentacoesService.web.ts`
- `src/services/produtos/produtosService.ts`
- `src/services/produtos/produtosService.web.ts`
- `src/services/visaoEstoque/visaoEstoqueService.ts`
- `src/types/movimentacao.types.ts`
- `src/utils/cicloProduto.ts`
- `src/utils/movimentacoes.ts`
- `tests/ciclo-produto.test.cjs`
- `tests/firebase-rules.test.cjs`
- `tests/produtos.test.cjs`
- `tests/visao-estoque.test.cjs`

Removidos: nenhum arquivo de fonte; símbolos e fluxos de exclusão foram retirados dos arquivos existentes.

### Evidências visuais

- Home 360
- Produto ativo 360
- Vendedor e teclado 360
- Histórico 360
- Nome longo no histórico 360
- Entrada sem vendedor 360
- Histórico global 360
- Relatórios 360
- Vendedor e teclado 411
- Histórico 411
- Relatório final 411
- Home final 411
- Scroll e botão acima do teclado aberto 411

Version/versionCode continuam `1.0.0`/`1`. Não houve build release, AAB, tag 1.1.0, publicação ou commit final da 11A. A 11B não foi iniciada.

## Resultado

ETAPA 11A APROVADA
