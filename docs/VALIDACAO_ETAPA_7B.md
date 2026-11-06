# Validação da etapa 7B — 05/10/2026

As evidências complementares desta validação integram o acervo interno do projeto.

**ETAPA 7B APROVADA TECNICAMENTE**, com limite conservador de cascade mantido em seis.
Não há relatórios, dependências adicionais, migrações ou commit nesta entrega.
Alterações anteriores do workspace foram preservadas.

| Critério | Resultado | Evidência |
| --- | --- | --- |
| Editar entrada | PASS | Android +5→+8; saldo 11→14. Deltas e validações nas Rules. |
| Editar saída | PASS | Android -4→-6; saldo 14→12. |
| Tipo imutável | PASS | Texto sem controle de alteração na UI; ataques entrada/saída negados nas Rules. |
| Excluir entrada | PASS | Entrada 8 removida, saldo 18→10; inicial 10 bloqueada após saída 1. |
| Excluir saída | PASS | Saída 6 removida, saldo 12→18. |
| Estoque negativo | PASS | Editar saída 20 e excluir inicial com saldo 9 rejeitados sem gravações. |
| Concorrência | PASS | Casos A/B com commits simultâneos e releitura no Emulator; serviços reavaliam saldo e quantidade antigos. |
| Histórico × estoque | PASS | Soma do histórico real conferida no Emulator e no Firestore publicado após operações. |
| Observação somente | PASS | Serviço escreve só movimento; Rules permitem remoção opcional; Android observação alterada com saldo 9. |
| Offline | PASS | Android sem Wi-Fi/dados: editar/excluir falham com mensagem adequada; saldo 9 e dois movimentos preservados. |
| Tempo real/UI | PASS | Listeners atualizam detalhes, lista, histórico e reposição; nenhum reinício forçado. |
| Cancelamento | PASS | Modal Excluir→Cancelar manteve saldo 12 e três movimentos. |
| Reposição | PASS | Mínimo 12: estado presente em 10/11/12/9 e ausente em 14/15/18. |
| Logout/login | PASS | Lista e detalhes retornaram saldo 9 e histórico coerente. |
| Cascade produto | PASS dentro do limite | Android removeu produto e histórico; Emulator prova conjunto completo e nega lote incompleto. |
| Security Rules | PASS | 417 cenários, zero falhas; auditoria sem bypass identificado; validador Firebase sem erros. |
| Android development build | PASS | Build nativo de desenvolvimento existente, Metro atualizado, Pixel 6 API 36 em 360×740. |

## Cascade e limitações

Limite final: **6 movimentos**, com todos os IDs existentes registrados. Não se
alega máximo absoluto; é o limite conservador do protocolo previamente validado.
Após exclusões num registro antes parcial, pode continuar bloqueado mesmo abaixo
de 6 se não houver prova completa dos IDs. Nenhum dado é removido nesse caso.
O cliente explica histórico inconsistente/incompleto e não faz reparo destrutivo.

10/20/50 movimentos: protocolo final negou cascade e preservou o conjunto inteiro.
Experimento temporário com registro completo de 10 foi aceito no Emulator; não foi
publicado porque N caminhos getAfter mais perfil e setor antes/depois não cabem
no orçamento de 10 por operação. Emulator não aplica todos os limites de produção.
Cascade maior permanece necessidade futura de backend confiável, sem lotes parciais.

Detalhes, protocolo, semântica de quantidadeInicial e JSON da auditoria em
[ARQUITETURA.md](ARQUITETURA.md#etapa-7b--correções-e-exclusões-individuais).
Referências oficiais: [limites de acesso nas Rules](https://firebase.google.com/docs/firestore/security/rules-conditions#access_call_limits) e
[diferenças do Emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore#how_the_cloud_firestore_emulator_differs_from_production).
Web mantém a limitação do SDK nativo aprovada nas etapas anteriores; não houve migração.
Android validado em emulador, sem dispositivo físico nesta sessão.

## Validações finais

- TypeScript: npx tsc --noEmit, PASS.
- Expo Doctor: 18/18, PASS.
- Lógica/serviços: 46 testes, PASS.
- Auth/Firestore Rules Emulator em projeto demo-estoque-local: 417 testes, PASS.
- firebase-security-rules-auditor: score 5, sem achados nos caminhos avaliados.
- Validador Firebase: sem erros.
- Deploy: exclusivamente firestore:rules, controle-de-estoque---tcc, concluído.
- Android: fluxo integral, confirmação/cancelamento, offline e login executados.
- git diff --check: PASS.

A comparação Firestore percorreu os saldos11→14→12→12(rejeição/cancelamento)→18→10→9;
falhas offline e edição da observação preservaram9. Em cada verificação, histórico
somado e estoqueAtual coincidiram; quantidadeInicial permaneceu10.
Testes locais também conferem inicial zero, legado sem id, inteiro seguro, registro
parcial e cascade seguro após correções de históricos acima de seis.

Conta temporária, estabelecimento, perfil, setor, produto e movimentos foram
removidos ao terminar. Ausência foi verificada pela API administrativa Firebase;
nenhuma credencial foi versionada. Tamanho/densidade do emulador foram restaurados;
aplicativo ficou deslogado.

## Arquivos desta etapa

Modificados sobre o estado encontrado no início (alguns já eram não versionados):

- src/components/ConfirmModal.tsx
- src/navigation/types.ts
- src/navigation/StockNavigator.tsx
- src/screens/setores/MovimentacaoFormScreen.tsx
- src/screens/setores/ProdutoDetalhesScreen.tsx
- src/services/movimentacoes/movimentacoesService.ts
- src/services/movimentacoes/movimentacoesService.web.ts
- src/services/firebase/converters/movimentacao.ts
- src/utils/movimentacoes.ts
- firestore.rules
- tests/produtos.test.cjs
- tests/firebase-rules.test.cjs
- docs/ARQUITETURA.md

Criados:

- docs/VALIDACAO_ETAPA_7B.md
- docs/validacoes/etapa7b-android-historico.png

Removidos nesta etapa: nenhum arquivo do projeto.
Remoções e outras alterações que já existiam no git status não pertencem à7B.

## Pendências

Nenhuma pendência funcional nos fluxos executados. Cascade grande exige backend
futuro, conforme exceção de segurança autorizada na solicitação. Testes não são
prova exaustiva de segurança. Relatórios não foram iniciados.

Histórico Android em 360×740
