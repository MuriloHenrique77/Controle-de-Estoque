# Welcome Setority — 07/10/2026

As evidências complementares desta validação integram o acervo interno do projeto.

PASS. Nova primeira tela da área de autenticação, sem temporização ou segunda splash.

## Implementação

- `src/screens/auth/WelcomeScreen.tsx`: símbolo oficial, nome e subtítulo renderizados como texto, ações Entrar/Criar conta.
- `src/navigation/AuthNavigator.tsx`: Welcome como rota inicial; Login, Cadastro e RecuperarSenha preservados. Somente Welcome sem header.
- `src/components/ui/AppButton.tsx`: variante outline e estilo opcional; variantes anteriores mantidas. Welcome usa altura mínima 52 dp, borda 1 dp, raio 12 dp e distância 16 dp entre botões.
- `tests/welcome.test.cjs`: ações encaminhadas aos formulários existentes, rolagem de acessibilidade e proteção dos cinco estados do Root.

Foreground oficial `assets/setority-adaptive-foreground.png`, sem edição. Canvas de até 288 dp aproveita as margens transparentes originais para um símbolo visível de cerca de 160 dp. `resizeMode="contain"`. Inter e tokens existentes; fundo #F7F8FA, principal #456A8C, texto #25313C/#66727C. Um SafeAreaView com os insets do provider existente, sem duplicar inset do header. Sem scroll no tamanho habitual; rolagem habilitada em altura útil pequena ou fonte ampliada.

RootNavigator, SessionProvider, resolverSessao, serviços Firebase, Rules, onboarding, telas internas, StatusBar dark, assets, app.json e configuração nativa de ícone/splash não foram alterados nesta feature. Nenhuma dependência nova.

## Fluxos validados

Pixel_6_API_36, development build existente, sem nova compilação APK. Janela visível à direita do monitor principal; ADB device e boot 1. Ajustes temporários de 360×740/density 160, teclado e fonte 200% restaurados ao final (1080×2400/density 420, fonte 1.0, configuração temporária de handwriting removida).

| Caso | Resultado |
| --- | --- |
| Sessão autenticada ao abrir | Home, sem Welcome |
| Logout | Welcome |
| Entrar | Login existente |
| Voltar Android no Login | Welcome |
| Criar conta | Cadastro existente |
| Voltar Android no Cadastro | Welcome |
| Cadastro sintético pela UI | Onboarding existente |
| Concluir estabelecimento pela UI | Home |
| Logout e login da conta criada | Home |
| Fechar/reabrir autenticado | Home da conta criada |
| Fonte 200% | Scroll disponível; Entrar acessível; voltar retorna |

A automação precisou esperar a hierarquia nativa estabilizar após reabertura. Conferência posterior confirmou Home com o estabelecimento correto. Nenhuma alteração do aplicativo foi necessária para essa espera.

Conta sintética `welcome-…@example.test`, estabelecimento TESTE Welcome Setority: cleanup confirmou ausência do perfil, estabelecimento vazio e usuário Auth. Nenhum setor/produto/movimento criado; conta real preservada. Credenciais temporárias apagadas.

## Checks

- TypeScript: PASS.
- Auth, recuperação, Conta, navegação, polimento e Welcome: 30/30 PASS (28 existentes + dois novos).
- Expo Doctor: 18/18 PASS.
- git diff --check: PASS.
- Assets oficiais e arquivos protegidos: preservados.

Evidências: 360×740, fonte ampliada.

Nenhum commit, APK oficial ou preparação de release realizada. A pendência de configuração Firebase iOS anterior permanece fora deste escopo; não houve teste nativo iOS nesta feature.
