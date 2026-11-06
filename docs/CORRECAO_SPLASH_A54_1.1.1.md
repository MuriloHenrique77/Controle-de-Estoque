# Correção da splash no Galaxy A54 — candidata 1.1.1

As evidências complementares desta validação integram o acervo interno do projeto.

Data: 15/10/2026. Branch: `codex/fix-splash-a54`. Base: `cfeb0ed2ee1eb920fa6f8e789bf1cce0f4425eaf`, tag v1.1.0 preservada. Sem commit, tag ou publicação desta correção até aprovação.

## Causa raiz confirmada no aparelho

O fechamento da 11C colocou preventAutoHideAsync no módulo App e a única chamada de ocultação dentro de BootScreen. Essa chamada exigia pronto, onLayout e onLoadEnd da imagem. A Boot pertence ao ramo transitório loading do RootNavigator; quando o Auth resolve, esse ramo é substituído.

No A54, fontsLoaded=true e error=false; SafeAreaProvider recebeu insets e montou seus filhos. RootNavigator montou Boot em loading e Auth resolveu usuário ausente. A navegação trocou para unauthenticated antes de onLoadEnd da imagem. Boot desmontou sem chamar hide; a retenção manual desativara o auto-hide nativo, deixando keepSplashScreenOnScreen ativo. O processo e MainActivity continuavam vivos, React executara Running main, mas a starting window persistia. Não era dado de upgrade, fonte ausente, consulta Firestore bloqueada ou falta de biblioteca ARM64.

Fontes Inter_400Regular/500Medium/600SemiBold/700Bold existem no APK; useFonts retornou carregado no A54. Os insets inicialmente indisponíveis passaram a disponíveis antes de montar Boot, descartando a hipótese inicial de bloqueio persistente do SafeAreaProvider neste caso.

## Diagnóstico antes/depois

Instrumentação temporária [BOOT_DIAG] em App, Boot, RootNavigator, SessionProvider, observador Auth e resolução de perfil; leitura temporária do estado de insets na dependência. Somente eventos/flags/estados; nenhum e-mail, UID Firebase, token ou credencial. Alterações temporárias em navegação, sessão, serviço Auth e dependência foram revertidas antes do APK candidato final.

Na versão com problema:

```text
fontes carregadas=true
erro fontes=false
appIsReady=true
SafeAreaProvider insetsReady=true
RootNavigator render=loading
BootScreen render=true
onLayout Boot
Boot imagem pronta=false
Boot layout pronto=true
usuario resolvido presente=false
RootNavigator render=unauthenticated
sessao transicao=unauthenticated
```

Último BOOT_DIAG: `sessao transicao=unauthenticated`. Não houve onLoadEnd da imagem nem chamada de hide. dumpsys confirmou Splash Screen com.murilo.estoqueporsetores como janela fullscreen.

Na correção instrumentada:

```text
onLayout root
antes hideAsync
depois hideAsync
SafeAreaProvider insetsReady=true
RootNavigator render=loading
BootScreen render
SessionProvider montado
Firebase Auth inicializado
usuario resolvido presente=false
RootNavigator render=unauthenticated
```

hideAsync concluiu antes da montagem do SessionProvider e da inicialização do Auth. Esse teste de isolamento confirmou que liberar a splash pelo layout da raiz resolve o bloqueio sem mudar a sessão. dumpsys passou a mostrar MainActivity e a UI exibiu Setority/Entrar/Criar conta.

## Correção definitiva

- App mantém o prevent global e possui um callback no onLayout do SafeAreaProvider já existente, que é persistente e efetivamente disparou no A54.
- O callback chama hideAsync uma vez, com erro tratado e possibilidade de nova tentativa em outro layout se houver rejeição. Não consulta fontes, imagem, sessão, Auth ou perfil.
- Boot é somente apresentação e pode continuar mostrando progresso/erro durante inicialização local ou sessão. Não controla mais a splash.
- Sem timer/delay fixo, retorno null na raiz, reinício de Activity como solução, desativação de Firebase ou alteração de dados.
- Mesmos componentes visuais, estilos, assets, navegação, cores e StatusBar dark. Sem dependência nova.

Anterior: splash retida → fontes → SessionProvider → Boot loading → imagem/layout → hide; troca rápida de sessão podia eliminar a única chamada.

Corrigido: raiz React monta/layout → hideAsync → conteúdo React/Boot continua enquanto necessário → Login/Home conforme sessão. A splash nativa não aguarda rede e sua liberação sobrevive à desmontagem da Boot.

## ARM64 e emulador

Galaxy A54 SM-A546E, Android API36, ABI arm64-v8a. APK original contém libreactnative, Hermes, appmodules, expo-modules-core e libc++ para ARM64. Em Pixel_6_API_36 x86_64, a release original chegou à tela de entrada; no A54 a ordem de eventos evidenciou a corrida. Sucesso x86_64 não cobria esse timing. Não se atribui a falha a uma ABI ausente nem se afirma um defeito específico do processador.

Emulador mantido visível no canto direito do monitor principal, ADB device/boot1, sem Android Studio/headless. Nenhuma mudança permanente de resolução/DPI. A54 testado por ADB seguro via Wi-Fi; nenhum segredo de conta solicitado.

## Offline instrumentado — PASS

Após inicialização online, encerrado o app, desligados Wi-Fi e dados no próprio A54 e realizado cold start. Captura local confirmou wifi_offline=0, data_offline=0 e Active default network: none. Mesmo sem rede, hideAsync concluiu antes de Auth; MainActivity substituiu a splash e Setority/Entrar/Criar conta estavam acessíveis. Wi-Fi/dados restaurados; o endpoint ADB mudou e foi reconectado com o endereço informado pelo usuário.

Trata-se de sessão sem usuário, apropriada ao clean install. Não houve consulta ou mutação de perfil/estoque em produção. A independência de fontes/sessão pendentes também é exercitada nos testes de raiz.

## Regressão — PASS

TypeScript sem erro; Expo Doctor18/18; lógica/serviços/UI144/144; Rules locais551/551 no projeto demo-estoque-local; git diff --check PASS. Nenhum deploy ou alteração em Firestore, Rules, indexes ou Auth. O antigo teste de flags da Boot foi substituído por testes da raiz: fontes pendentes, Boot substituída antes da imagem, erro de fonte e rejeição tratada de hideAsync. Contraprova: os quatro falham contra App.tsx da v1.1.0 original e passam com a correção.

## APK final e clean install

- Candidata local: `release/Setority-v1.1.1-candidata.apk`, 113291161 bytes.
- SHA-256: `638d90e22322564ea0ed381aa8c868670d818b2bf632fda6014f2dbdd14b097d`.
- Package `com.murilo.estoqueporsetores`, versionName1.1.1, versionCode3, debuggable=false pelo apkanalyzer. apksigner verify PASS, mesma chave de produção; certificado SHA-256 `02262f7e6606576ba250c9acf16425ae34749d141502000adc62c5729b796016`.
- APK universal com armeabi-v7a, arm64-v8a, x86 e x86_64; Hermes/React Native e bundle embarcado presentes. Bundle final inspecionado sem BOOT_DIAG.
- A54: versão de teste desinstalada, candidata instalada do zero, cold start online sem Metro PASS. Splash removida, processo vivo, MainActivity no topo e tela de entrada carregada, sem crash.
- Abertura fria offline do mesmo APK final PASS: Wi-Fi/dados0 e Active default network:none; tela de entrada React acessível, sem starting window retida. Rede e estado prévio da depuração Wi-Fi restaurados.
- O mesmo APK final foi instalado/aberto no Pixel_6_API_36 x86_64 visível: PASS. Não depende de Metro/dev server; porta8081 sem listener.

## Sessão autenticada e Boot/versionamento — PASS

Para cobrir perfil pendente, criada uma única conta Auth sintética de teste, credenciais apenas na RAM do helper e sem log/arquivo de credenciais. Login normal no app; nenhum estabelecimento ou documento Firestore criado. Cold start online com esse usuário mostrou a Boot React com **v1.1.1**, depois onboarding por ausência de perfil. Frame do vídeo preservado como evidência; nenhum atraso artificial introduzido para capturar a Boot.

Cold start offline autenticado do mesmo APK final chegou à tela React “Não foi possível carregar sua sessão”, com “Verifique sua conexão e tente novamente”, Tentar novamente/Sair da conta, enquanto MainActivity era a janela de topo. Confirmação também com Active default network:none. Portanto até a falha real da consulta de perfil deixa de reter a splash nativa.

Logout concluído pelo fluxo normal; conta Auth sintética removida com seu próprio token e ausência confirmada. Nenhuma credencial persistida, alteração de configuração Auth ou escrita em Firestore. Keystore, senhas e init script de assinatura temporários removidos após compilar/verificar o APK. A imagem/layout da Boot e suas fontes/versão foram preservados.

## Evidências selecionadas

- Antes: eventos sanitizados.
- Depois: liberação antes do Auth.
- Offline diagnóstico, offline final sem usuário e offline final autenticado.
- A54 online em clean install.
- Boot v1.1.1 no A54.
- Erro React de sessão offline.

Nenhum e-mail, UID Firebase, token ou senha nas evidências de diagnóstico. Vídeos/intermediários ficam fora do versionamento; gravações que incluíam a tela de configurações do aparelho foram descartadas após extrair o frame do app.

## Limites e estado Git

v1.1.0 e seus APK/AAB/documentos históricos preservados. Preparação da candidata1.1.1/code3 somente após causa reproduzida e correção confirmada no A54. Sem tag/release/publicação automática, sem commit. Arquivo do usuário setority-log.txt preservado e fora das alterações desta correção.
