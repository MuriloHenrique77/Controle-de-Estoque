# Changelog

## [1.1.2] - 2026-10-30

### Fixed
- Corrigido o envio de redefinição de senha pela tela Conta/Perfil.
- Corrigida a mensagem de confirmação no fluxo autenticado.
- Removido falso sucesso quando o envio pelo Firebase falha.

## [1.1.1]

### Fixed
- A raiz persistente libera a splash nativa no primeiro layout, independentemente de imagem, fontes e sessão. Corrige a retenção indefinida observada no Galaxy A54 quando a Boot é desmontada antes do carregamento da imagem.
- Boot permanece apenas visual; testes de lifecycle cobrem a corrida de inicialização e falhas de carregamento/ocultação.

Versão 1.1.1, Android versionCode 3. Histórico da correção e validação em docs/CORRECAO_SPLASH_A54_1.1.1.md.

## [1.1.0] - 2026-10-13

### Added
- Identificação opcional do vendedor nas movimentações de saída.
- Boot Setority e exibição dinâmica da versão no Boot e na Conta, autorizados no fechamento da release.

### Changed
- Home simplificada sem movimentações recentes.
- Produtos deixam de possuir exclusão permanente e passam a usar exclusivamente inativação/reativação.

### Fixed
- Splash nativa permanece visível até o Boot estar pronto, sem intervalo vazio ou delay artificial.

## [1.0.0] - 2026-10-08

- APK release assinado e validado do Setority, com Welcome, autenticação e recuperação de senha, onboarding, setores, produtos, entradas/saídas, histórico, relatórios e conta.
- Referência histórica: `docs/RELEASE_1.0.0.md` e tag `v1.0.0`.
