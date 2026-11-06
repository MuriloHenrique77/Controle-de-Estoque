# Setority v1.1.2

Data: 30/10/2026. Branch: codex/release-1-1-2. Release local para distribuição manual; sem push, publicação em loja ou envio automático.

## Código e histórico

- Baseline da correção da splash 1.1.1, anteriormente sem commit, preservada separadamente em dc25c79ed24f255715d897a0045cf8fb1e1aae97, `fix: preserva correcao validada da splash v1.1.1`. Nenhuma alteração adicional de splash/Boot nesta release.
- Commit exclusivo da correção de reset: 52e5549538b2b4619d6fdc056ef26557e845a44f, `fix: corrige redefinicao de senha pelo perfil`, sete arquivos; sem inclusão dos arquivos de versionamento ou da correção anterior de splash.
- Commit oficial de release: objeto apontado pela tag anotada v1.1.2, mensagem `Setority v1.1.2`. Consultar `git rev-parse 'v1.1.2^{commit}'`. O hash completo é informado também no relatório final; esta referência evita tentar inserir o hash do commit no próprio conteúdo que o define.
- APK/AAB compilados a partir do commit da correção acima com os metadados 1.1.2/code4 que integram o commit de release. Nenhuma mudança de código após compilação.
- Tags v1.0.0/v1.1.0 e artefatos históricos preservados. Não foi criada retroativamente uma tag v1.1.1. O APK 1.1.1 existente foi utilizado como baseline do upgrade, com assinatura e versão confirmadas.
- Arquivo preexistente do usuário setority-log.txt permanece sem inclusão no Git. Artefatos APK/AAB e auxiliares temporários permanecem ignorados.

## Versão e identidade — PASS

- expo.version, package.json e raiz do package-lock.json: 1.1.2.
- Android versionName: 1.1.2; versionCode: 4, superior ao 3 da v1.1.1.
- Package Android e bundle identifier preservados: com.murilo.estoqueporsetores.
- Nome Setority, ícone, adaptive icon, splash, Boot, paleta, fontes e StatusBar dark preservados.
- Comparação estrutural de app.json contra 52e5549: somente version/versionCode diferentes.
- Comparação de imagens/fontes empacotadas contra APK 1.1.1: 301 arquivos, zero diferenças.
- Boot e Conta continuam usando obterVersaoApp() a partir de app.json. Vídeo da abertura real confirma Boot v1.1.2; tela Conta confirma Versão 1.1.2, sem hardcode adicional. [Frame do Boot](validacoes/release112-boot.png).

## Correções

- Reset pelo Perfil lê auth.currentUser.email e confere UID da sessão, sem campo manual ou uso de e-mail de outro usuário.
- Idioma pt configurado antes do envio, na mesma instância Auth; identidade/e-mail revalidados após a espera assíncrona.
- Uma única implementação de envio nativo, com trava compartilhada; erros não são transformados em sucesso no Perfil.
- Feedback específico somente após sucesso: “Enviamos as instruções de redefinição de senha para seu e-mail.”
- Fluxo público mantém validação e resposta genérica contra enumeração: “Se existir uma conta com este e-mail, enviaremos instruções para redefinir sua senha.”
- Offline e falhas liberam loading, mostram erro claro e permitem nova tentativa. Duplo envio coberto por testes de serviço e UI.

Detalhes e limites do diagnóstico histórico em [validação da correção](VALIDACAO_CORRECAO_RESET_PERFIL_v1.1.2.md). A causa da entrega perdida no incidente anterior não foi comprovada retrospectivamente; os defeitos de microcopy/falso sucesso e os envios atuais têm evidência própria. Não houve alteração de Firebase, Firestore, Rules, estoque, produtos, vendedorNome, Home, relatórios ou navegação nesta release.

## Checks antes do commit da correção — PASS

TypeScript sem erros; Expo Doctor 18/18; Auth 31/31; lógica/serviços/UI 149/149, incluindo Auth; Rules 551/551; git diff --check PASS; git status revisado. Checks executados antes dos commits e do bump.

## Build e assinatura — PASS

Prebuild apenas Android, --no-install, respeitando os plugins existentes e sem novas dependências. Gradle assembleRelease e bundleRelease: BUILD SUCCESSFUL em 3 minutos, 835 tarefas, 84 executadas e 751 up-to-date. JavaScript/Hermes embarcados e APK universal com armeabi-v7a, arm64-v8a, x86 e x86_64.

Mesma chave remota de produção já existente no EAS, recuperada por consulta somente leitura. Nenhuma keystore nova ou debug utilizada. Assinatura aplicada por init script privado e temporário, fora do repositório, com ACL restrita ao usuário. Cache CMake curto já existente reutilizado para o limite de caminhos do Windows; sem alteração de código/configuração persistente por esse motivo.

Certificado de produção SHA-256: `02262f7e6606576ba250c9acf16425ae34749d141502000adc62c5729b796016`.

APK: apksigner verify PASS, certificado igual à 1.1.1, apkanalyzer confirma package/1.1.2/code4 e debuggable=false. AAB: bundletool 1.18.1 validate PASS; manifesto confirma package/1.1.2/code4, sem flag debug; jarsigner retorna jar verified e keytool confirma o mesmo SHA-256 do certificado. Avisos de cadeia self-signed/sem TSA são os esperados para assinatura Android, sem falha criptográfica. Keystore, JSON com senhas, init script e marcador privados removidos após verificação.

## Artefatos

| Artefato | Caminho local | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| APK | release/Setority-v1.1.2.apk | 113292893 | `e69ca2e2b8bd556b06f9fb2cc66979ad04d81e7b756c7ac0c9cfdaeb39cae712` |
| AAB | release/Setority-v1.1.2.aab | 77256532 | `1c743b6fa265fc12ce5ea2fa351511141dd5c5b5aac07f05a8c077fc1529599c` |

Ambos ignorados pelo Git conforme política existente. APK 1.1.1 utilizado para upgrade: release/Setority-v1.1.1-candidata.apk, 113291161 bytes, SHA-256 `638d90e22322564ea0ed381aa8c868670d818b2bf632fda6014f2dbdd14b097d`, versionCode 3 e mesmo certificado de produção.

## Emulator, abertura e upgrade — PASS

Pixel_6_API_36 x86_64, Android API 36; adb device e sys.boot_completed=1 confirmados. Janela visível no canto direito do monitor principal, retângulo 1066,60–1506,796. Sem Android Studio, headless, janela escondida ou alteração de resolução/DPI.

Development build anterior removido somente do emulador para instalar a baseline de produção 1.1.1, devido à diferença de assinatura debug. Usuário fez login diretamente na janela com conta real existente; nenhuma senha fornecida ao agente. Estabelecimento e dados existentes carregados. Conteúdo estável de Home/Estoque/Movimentações/Relatórios/Conta registrado por hashes locais, sem registrar texto pessoal.

APK 1.1.2 instalado com adb install -r sobre a 1.1.1: Success. Nenhuma desinstalação ou limpeza de dados entre essas duas versões de produção. Abertura fria pelo launcher: splash → Boot v1.1.2 → Home autenticada, sem onboarding. Os cinco hashes de conteúdo anterior/posterior coincidiram, desconsiderando apenas texto de versão na Conta e relógio do sistema. Nenhuma escrita de estoque ou onboarding para esse teste; dados reais preservados.

Metro encerrado por Ctrl+C antes da instalação da baseline. Porta 8081 sem listener durante abertura e smoke. App iniciado pelo launcher, sem URL de desenvolvimento, expo start ou intervenção de VS Code. Native starting window liberada, processo vivo, sem BOOT_DIAG residual no cold start.

## Smoke do APK final

- Login real na baseline, upgrade preservando sessão, Home → Estoque → Movimentações → Relatórios → Conta: PASS.
- Versão 1.1.2 na Conta e Boot: PASS.
- Conta → Redefinir senha → confirmação → envio online: PASS, com mensagem específica após resolução do SDK Firebase.
- Recebimento/português/link: usuário confirmou explicitamente “sim” à solicitação de conferir esses três pontos do novo envio realizado pelo APK release 1.1.2. Caixa postal não acessada pelo agente; nenhuma senha ou link registrado.
- Perfil offline: Wi-Fi e dados desativados, Active default network:none. Erro “Não foi possível enviar o e-mail. Verifique sua conexão e tente novamente.”; nenhum sucesso; loading encerrado e ação habilitada. Rede restaurada; retry online passou.
- Logout confirmado e retorno ao fluxo público: PASS.
- Login → Esqueci minha senha: endereço sintético digitado manualmente no campo público e submetido pelo teclado; SDK resolveu e a mensagem genérica foi confirmada. Esse teste não representa entrega a uma conta real e não substitui a confirmação do Perfil.
- Retorno ao Login e último login manual no APK release 1.1.2: PASS. Usuário confirmou “entrei”; Home autenticada observada, conteúdo da Home e Conta conferido novamente com os hashes da baseline, sem onboarding. Conta continuou exibindo Versão 1.1.2. Nenhuma senha solicitada ou registrada.

Auxiliares de automação foram ajustados para aguardar foco do campo público e não usar Back quando o teclado físico não exibia IME; nenhuma alteração do aplicativo por causa disso. A asserção auxiliar offline com problema de aspas no shell foi movida a arquivo e repetida com PASS. Não houve falha funcional do app nesses ajustes.

## Logs

Durante cold start, navegação, reset e logout: nenhum FATAL EXCEPTION, ANR do app ou erro ReactNativeJS. Não foi observado Native animation workaround nesta janela examinada. Warnings de depreciação do template Android/Gradle e recomendação prebuild de expo-system-ui já existentes não motivaram alteração de dependência fora do escopo. Não há garantia de ausência de falhas em todos os dispositivos.

## Testes finais — PASS

- TypeScript: sem erros.
- Expo Doctor: 18/18.
- Auth: 31/31.
- Lógica/serviços/UI: 149/149, incluindo os testes Auth.
- Rules Emulator: 551/551, demo-estoque-local. Porta 8080 ocupada por outro processo local; configuração auxiliar ignorada usou Auth19099/Firestore18080/hub14400. Nenhuma mudança em firebase.json, Rules ou deploy.
- git diff --check: PASS.
- Sem mudanças de fonte ou dependência após esses checks; somente esta documentação/evidência.

## Galaxy A54

PENDENTE, não bloqueante conforme pedido: aparelho apareceu offline no ADB, sem conexão utilizável. Nenhuma instalação ou alegação de smoke físico da 1.1.2. Correção histórica de splash na 1.1.1 possui evidências próprias no A54, preservadas; não são tratadas como validação física desta release.

## Pendências e distribuição

Pendências bloqueantes: nenhuma. Smoke concluído e commit/tag locais autorizados pelo pedido de fechamento. Nenhuma publicação automática, push, envio por e-mail ou submissão à Play Store nesta etapa. Arquivos de assinatura não integram o projeto. Para distribuição, utilizar somente os dois artefatos e hashes acima. A54 permanece pendente não bloqueante, conforme seção própria.

## Resultado

SETORITY v1.1.2 APROVADO PARA DISTRIBUIÇÃO
