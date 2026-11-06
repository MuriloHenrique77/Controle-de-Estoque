# Validação da Etapa 10C — Conta e autenticação

Data: 06/10/2026. Resultado: **ETAPA 10C APROVADA**. Alterações da 10C sem commit.

## Checkpoint antes da implementação

TypeScript PASS, Expo Doctor 18/18, lógica/serviços 89/89, Rules Emulator 498/498 e diff --check PASS. Commit exclusivo da 10B: **82faa11e22cb004de4515765889d7ecd08b879c6** — feat: adiciona ciclo de vida ativo e inativo dos produtos (60 arquivos). Correção anterior da Status Bar preservada em commit separado **ac4e0cf** — fix: define icones escuros na status bar. Working tree limpa antes de iniciar a 10C.

## Implementação

PASS: ContaScreen usa somente os dados já presentes na sessão. E-mail/estabelecimento, redefinição com confirmação e logout com confirmação. AccountButton reutilizável com mínimo 48×48 dp nos headers; nenhuma quinta aba. Logout removido dos headers autenticados principais; saída de onboarding/erro preservada. Conta só existe no stack em authenticatedReady. SessionProvider e limpeza/invalidação existentes preservados.

PASS: Login/Cadastro adaptados aos componentes do Design System sem mudar cadastro → Auth → sessão → onboarding. Recuperação já existente revisada: AppScreen/AppCard/AppInput/AppButton/SectionHeader/FeedbackProvider, validação obrigatória/formato/trim, caixa original preservada, loading/disabled, retorno ao Login e proteção contra atualizações após unmount. Bloqueio de envio na UI e no serviço compartilhado impede concorrência entre telas, liberando retry em finally.

PASS: recuperarSenha permanece na camada de serviço com sendPasswordResetEmail/setLanguageCode do RN Firebase Auth 26.4.0. Não cria sessão, não opera Firestore, não armazena senha/token manualmente, não adiciona dependência, SDK Web ou backend. Conta conhecida não requer redigitar e-mail. Mensagem genérica igual nos dois fluxos e em auth/user-not-found. Erros comuns reutilizam tradução de Auth; códigos/detalhes técnicos não são mostrados. Offline: “É necessária conexão para enviar as instruções de redefinição.”, sem sucesso falso.

## Firebase Auth — leitura da configuração remota

Consulta administrativa somente leitura ao endpoint oficial /admin/v2/projects/controle-de-estoque---tcc/config: Email/Password enabled=true/passwordRequired=true; emailPrivacyConfig.enableImprovedEmailPrivacy=true; sendEmail.method=DEFAULT; resetPasswordTemplate padrão presente, HTML; callback https://controle-de-estoque---tcc.firebaseapp.com/__/auth/action; defaultLocale=en. Nenhuma configuração externa alterada e nenhum deploy nesta etapa.

Idioma pt por requisição confirmado na versão instalada e em [documentação RN Firebase](https://reference.rnfirebase.io/_react-native-firebase/auth/setLanguageCode.html) e [Firebase Android](https://firebase.google.com/docs/auth/android/manage-users#send_a_password_reset_email). O envio real pelo SDK foi aceito para contas sintéticas controladas. Não foi validado recebimento em caixa postal nem conclusão do reset na página hospedada (example.test não recebe e-mail).

Nenhuma ação manual obrigatória para ativar o fluxo. Para validar conteúdo/entrega: usar caixa de teste controlada, solicitar redefinição e conferir o e-mail/página hospedada. Para personalizar também o padrão remoto: Firebase Console → Authentication → Templates → Password reset → idioma português, revisar preview e salvar apenas se desejado. O app já envia languageCode pt sem modificar o padrão remoto en.

## Android development build — emulador visível

Pixel_6_API_36 existente reutilizado, emulator-5554 device, sys.boot_completed=1. Janela visível no canto direito do monitor principal: 1066,60–1506,810 (440×750), PrimaryScreen.WorkingArea 1536×816. ShowWindow/SetWindowPos e limites/IsWindowVisible confirmados no início e ao final; nenhuma interface do Android Studio aberta.

360×740/density160: Login/link, vazio, inválido, teclado, erro real de rede, reconexão/envio aceito/feedback genérico/retorno; login A, Conta A com e-mail/nome corretos, confirmação/cancelamento/envio conhecido/feedback; Conta offline com erro sem sucesso, logout offline com confirmação/cancelamento/retorno ao Login. Campo de senha e botão Entrar acessíveis por rolagem com teclado aberto; login concluído pelo botão sem fechar teclado previamente.

411×891/density160: Login/teclado, login B/Conta B sem e-mail ou estabelecimento A; acesso à Conta pelos headers de Estoque, Movimentações e Relatórios, alvo >=48×48 dp; logout online; recuperação/vazio/inválido/teclado/e-mail válido com espaços/trim, captura real de loading/spinner/disabled e envio aceito/feedback. Quatro abas preservadas. Sem dados A após troca B. Após novo login A, logout final confirmado.

31 capturas reais listadas abaixo. Emulador permanece aberto/visível no Login. Overrides restaurados: wm size reset (1080×2400), wm density reset (420); stylus_handwriting_enabled voltou a ausente; rede wifi/data habilitada e delay/speed restaurados para none/full. Alterações temporárias de rede não modificam permanentemente o AVD.

## Testes finais

| Verificação | Resultado |
| --- | --- |
| TypeScript — npx.cmd tsc --noEmit | PASS |
| Expo Doctor | PASS — 18/18 |
| Lógica/serviços — suíte anterior e novos | PASS — 96/96 (89 anteriores + 7 novos) |
| Rules Emulator — demo-estoque-local, auth/firestore | PASS — 498/498 |
| git diff --check e arquivos novos de texto | PASS |
| Android development build | PASS — APK nativo existente + JS/TS atual via Metro |

Novos testes: concorrência global/retry/caixa original, mensagens compartilhadas, dados A/B da Conta/estados sem ready, cancelamento/duplo envio/loading, erro offline/retorno após unmount e logout confirmado. Os cinco testes prévios de recuperação foram preservados e adaptados aos componentes atuais; os outros testes permanecem. Rules inalteradas, SHA256 FB53FAFAC80F05099989409C266DDB9594322B22EFB485D22740A3C749195CC7, sem deploy/auditor adicional.

Uma tentativa final de Rules encontrou porta 8080 ocupada pelo processo Java restante da execução anterior; somente o processo com --project_id demo-estoque-local e --port 8080 foi encerrado e a suíte completa passou após nova execução. Uma busca de snackbar na automação precisou reconhecer prefixo ✓; o feedback havia sido exibido corretamente. Capturas transitórias foram selecionadas conforme conteúdo real; não foi modificado código para prolongar loading.

## Limpeza das fixtures

Duas contas Auth sintéticas example.test (A/B), dois perfis e dois estabelecimentos exclusivos do teste removidos. Ausência de cada documento e conta confirmada. Exclusão Auth usou nova autenticação da própria fixture após a credencial inicial ficar antiga para deleção. Nenhum setor/produto/movimento real criado/modificado; credenciais temporárias removidas e nunca versionadas. Operações administrativas de limpeza não são funcionalidades do app.

## Arquivos modificados

- README.md
- docs/ARQUITETURA.md
- src/navigation/AuthenticatedNavigator.tsx
- src/navigation/RootNavigator.tsx
- src/navigation/StockNavigator.tsx
- src/navigation/types.ts
- src/screens/auth/CredenciaisScreen.tsx
- src/screens/auth/RecuperarSenhaScreen.tsx
- src/services/firebase/session.ts
- src/utils/auth.ts
- tests/recuperacao-senha.test.cjs

## Arquivos criados

- docs/VALIDACAO_ETAPA_10C.md
- docs/validacoes/etapa10c-conta-a-360.png
- docs/validacoes/etapa10c-conta-b-411.png
- docs/validacoes/etapa10c-conta-confirmacao-360.png
- docs/validacoes/etapa10c-conta-offline-360.png
- docs/validacoes/etapa10c-conta-sucesso-360.png
- docs/validacoes/etapa10c-header-estoque-411.png
- docs/validacoes/etapa10c-header-movimentacoes-411.png
- docs/validacoes/etapa10c-header-relatorios-411.png
- docs/validacoes/etapa10c-home-a-360.png
- docs/validacoes/etapa10c-home-b-411.png
- docs/validacoes/etapa10c-login-360.png
- docs/validacoes/etapa10c-login-411.png
- docs/validacoes/etapa10c-login-final-360.png
- docs/validacoes/etapa10c-login-teclado-360.png
- docs/validacoes/etapa10c-login-teclado-411.png
- docs/validacoes/etapa10c-login-teclado-scroll-360.png
- docs/validacoes/etapa10c-logout-confirmacao-360.png
- docs/validacoes/etapa10c-logout-offline-login-360.png
- docs/validacoes/etapa10c-recuperacao-411.png
- docs/validacoes/etapa10c-recuperacao-erro-snackbar-360.png
- docs/validacoes/etapa10c-recuperacao-invalido-360.png
- docs/validacoes/etapa10c-recuperacao-invalido-411.png
- docs/validacoes/etapa10c-recuperacao-loading-411.png
- docs/validacoes/etapa10c-recuperacao-offline-360.png
- docs/validacoes/etapa10c-recuperacao-retorno-360.png
- docs/validacoes/etapa10c-recuperacao-sucesso-360.png
- docs/validacoes/etapa10c-recuperacao-sucesso-411.png
- docs/validacoes/etapa10c-recuperacao-teclado-360.png
- docs/validacoes/etapa10c-recuperacao-teclado-411.png
- docs/validacoes/etapa10c-recuperacao-vazio-360.png
- docs/validacoes/etapa10c-recuperacao-vazio-411.png
- src/components/AccountButton.tsx
- src/screens/conta/ContaScreen.tsx
- tests/conta.test.cjs

## Arquivos removidos

Nenhum arquivo previamente versionado removido. Arquivos temporários/fixtures não fazem parte do repositório.

## Pendências e limites

Nenhuma pendência bloqueante da implementação. Entrega em caixa postal e conclusão de redefinição permanecem sem validação; ação manual opcional descrita acima. Teste Android realizado no development build existente; não valida publicação em loja ou iOS. Não iniciado redesign completo nem próxima etapa.
