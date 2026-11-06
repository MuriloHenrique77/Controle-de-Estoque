# Validação da recuperação de senha

Execução: 05–06/10/2026. Resultado: RECUPERAÇÃO DE SENHA APROVADA.

## Implementação

Login → “Esqueci minha senha?” → e-mail → enviar → resposta genérica → voltar ao Login.
E-mail obrigatório, trim e formato básico são validados na tela e no serviço.
O serviço existente usa `sendPasswordResetEmail` do React Native Firebase já instalado.
Nenhuma dependência, Firebase Web SDK ou backend foi adicionado.

A tela bloqueia solicitações simultâneas, desabilita o formulário durante o envio,
mostra ActivityIndicator e protege atualizações após sair da tela. Erros de formato,
conexão, excesso de tentativas e indisponibilidade têm mensagens em português,
sem códigos técnicos. Conta inexistente recebe a mesma resposta genérica:

> Se existir uma conta com este e-mail, enviaremos instruções para redefinir sua senha.

Onboarding, cadastro, SessionProvider, Firestore, Security Rules, setores, produtos,
movimentações e relatórios não foram alterados nesta tarefa. O componente de
credenciais recebeu um callback opcional exibido somente no Login.

## Firebase Authentication

A configuração externa foi consultada em modo somente leitura: Email/Password
habilitado, envio padrão do Firebase, template padrão de recuperação e callback
`https://controle-de-estoque---tcc.firebaseapp.com/__/auth/action`.
O idioma padrão do projeto continua `en`, sem alterar configurações externas.
O serviço aguarda `setLanguageCode(auth, 'pt')` antes de enviar a solicitação.
O SDK nativo suporta essa configuração conforme a
[referência oficial](https://reference.rnfirebase.io/_react-native-firebase/auth/setLanguageCode.html).

O envio real foi aceito pelo Firebase no Android para uma conta temporária com
endereço sintético de teste. A conta foi removida após a execução, sem criar perfil,
estabelecimento ou documentos no Firestore. Não foi validado o recebimento em uma
caixa postal nem a troca de senha na página hospedada; o domínio de teste não recebe
mensagens. O teste confirma o envio pelo SDK e a resposta da interface.

## Android development build

Pixel_6_API_36, pacote `com.murilo.estoqueporsetores`, área 360×740:

| Cenário | Resultado |
| --- | --- |
| Login e link de recuperação | PASS |
| E-mail vazio e formato inválido | PASS |
| E-mail válido e envio real pelo SDK | PASS |
| Loading e botão visualmente desabilitado | PASS |
| Erro com rede desligada e tentativa após reconectar | PASS |
| Mensagem genérica de sucesso | PASS |
| Teclado de e-mail, fechamento e formulário | PASS |
| Retorno ao Login | PASS |

Evidências em `docs/validacoes/`: `recuperacao-login.png`,
`recuperacao-invalido.png`, `recuperacao-teclado.png`, `recuperacao-loading.png`,
`recuperacao-conexao.png`, `recuperacao-sucesso.png`, `recuperacao-retorno.png`.
A captura do estado transitório foi repetida sem esperar o dump de acessibilidade,
pois a primeira tentativa de captura ocorreu após o erro de rede.
Após a orientação de ambiente, a janela foi confirmada visível e inteiramente
dentro da área útil do monitor principal, à direita. ADB confirmou `device` e
`sys.boot_completed=1`. Resolução e densidade temporárias foram restauradas aos
valores físicos do AVD (1080×2400, 420 dpi).

## Testes

- TypeScript: PASS (`npx tsc --noEmit`).
- Expo Doctor: PASS, 18/18 verificações.
- Testes de lógica/serviços: PASS, 73/73, incluindo cinco novos testes.
- Firestore/Auth Emulators: PASS, 446/446 testes existentes de regras.
- `git diff --check`: PASS.

Os novos testes cobrem validação, mensagens de erro, idioma/trim no serviço,
resposta genérica para conta ausente, bloqueio de envio duplicado, loading,
repetição após erro, retorno e conclusão após desmontagem.

## Arquivos desta tarefa

- `src/navigation/AuthNavigator.tsx`
- `src/screens/auth/LoginScreen.tsx`
- `src/screens/auth/CredenciaisScreen.tsx`
- `src/screens/auth/RecuperarSenhaScreen.tsx` (novo)
- `src/services/firebase/session.ts`
- `src/services/firebase/session.web.ts`
- `src/utils/auth.ts`
- `tests/recuperacao-senha.test.cjs` (novo)
- `README.md`
- Este documento e as sete imagens de evidência.

Alterações anteriores do repositório foram preservadas. Nenhum commit realizado.
