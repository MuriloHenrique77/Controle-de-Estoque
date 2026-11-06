# Setority 1.0.0 — referência histórica

APK lançado em 08/10/2026. Snapshot de fontes preservado pela tag `v1.0.0`, criada em 12/10/2026 antes das evoluções da Etapa 11A.

- Package: `com.murilo.estoqueporsetores`.
- Versão `1.0.0`; versionCode `1`; Expo SDK 54.
- APK: `release/Setority-v1.0.0.apk`, 113.530.423 bytes.
- SHA-256: `607afd095119335258a714b8fe0c4ea2c63d2645e9aa2f14c55b56bf64549c11`.
- Build EAS de produção assinada, executada sem Metro.
- O SHA registrado pelo serviço EAS foi `f8ae9d1`; a build também incluiu as mudanças então não commitadas, agora preservadas no checkpoint `v1.0.0`.

## Comportamento da versão lançada

Autenticação Firebase, Welcome, recuperação de senha, onboarding de estabelecimento, setores, produtos, estoque por movimentações, histórico, edição/exclusão individual de movimentações, relatórios e conta.

A Home apresenta indicadores, ações rápidas e cinco movimentações recentes. Produtos podem ser inativados e reativados; exclusão permanente somente de produtos comprovadamente sem histórico, com salvaguardas de consistência. Movimentações não possuem identificação de vendedor.

O campo `possuiHistorico` preserva histórico irreversível. Setores com produtos ativos ou inativos não podem ser excluídos. Transações preservam saldo não negativo e isolamento por estabelecimento; operações críticas dependem de conexão.

## Baseline antes da Etapa 11A

Em 12/10/2026: TypeScript PASS, Expo Doctor 18/18, testes de lógica/serviços 100/100, Rules Emulator 500/500 e `git diff --check` PASS. Hash do APK lançado reconferido e preservado.

Os detalhes da entrega e da validação integram o acervo interno do projeto.

Esta referência descreve a 1.0.0. As mudanças da futura 1.1.0 serão documentadas separadamente e não alteram este histórico.
