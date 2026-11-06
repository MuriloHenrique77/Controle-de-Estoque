# Setority 1.1.0

Data: 13/10/2026. Branch: `codex/release-1-1-0`. Commit oficial: commit apontado pela tag anotada `v1.1.0` (consultar `git rev-list -n 1 v1.1.0`).

## Baseline e histórico

Antes de iniciar a 11C: TypeScript PASS, Expo Doctor 18/18, lógica/serviços/UI 138/138, Rules Emulator 551/551 e diff check PASS. Criado o commit exclusivo 11B `6030d00f79f36f90139c9436949caebc71c29aa8`, `test: valida release candidate da v1.1.0`, seguido de árvore limpa.

Tag v1.0.0 preservada em `417e401b9a21fded7544118c631c85a6cc8cbe17`, sem reescrever histórico. RELEASE_1.0.0.md e APK histórico intactos. APK v1.0.0: 113530423 bytes; SHA-256 `607afd095119335258a714b8fe0c4ea2c63d2645e9aa2f14c55b56bf64549c11`.

## Configuração

- Nome: Setority; package Android: `com.murilo.estoqueporsetores`.
- expo.version / package / versionName: `1.1.0`; Android versionCode: `2`, superior ao `1` da release anterior.
- Firebase project: `controle-de-estoque---tcc`, sem alteração de Auth, schema, Rules ou indexes.
- Rules implantadas correspondem à fonte validada 11A/11B: ruleset `fdb2eab8-b243-4cf9-aa96-4f437fbc7824`; SHA-256 da fonte normalizada `79eee65056192429da1b2cbcc677328010bcd0fcdcfd8cb03d4762706ff44b32`.
- Assets oficiais preservados: setority-icon.png, setority-adaptive-foreground.png, setority-adaptive-background.png e setority-splash.png. Cores, proporções, StatusBar dark e identificação Firebase preservadas.
- Configuração pública Expo conferida; prebuild executado somente para Android. Configuração específica da splash Android no plugin; configuração iOS/Web preservada.

## Mudanças funcionais

1. Home sem movimentações recentes, mantendo métricas e ações rápidas.
2. Produtos sem exclusão permanente; ciclo ativo/inativo/reativado preserva estoque e histórico.
3. Saídas com identificação opcional através de `vendedorNome`; vendedor não é entidade ou módulo comercial.

O pedido 11C pressupunha Boot e versão dinâmica que não existiam na baseline. Usuário autorizou explicitamente acrescentar somente esses elementos: Boot usa asset/tema existentes, sem delay artificial, e Boot/Conta obtêm a versão de app.json. Auth e SessionProvider não alterados.

O primeiro APK de validação revelou um intervalo vazio entre a splash do sistema e a montagem do Boot. `expo-splash-screen` estava ausente; adicionada somente essa dependência compatível com SDK 54, indispensável para controlar a splash nativa. Configuração Android usa o foreground oficial, contain, imageWidth 216 e fundo #F7F9FC, na mesma escala do Boot; o arquivo setority-splash original permanece intacto na configuração legada. A splash só é liberada com imagem/layout/conteúdo prontos; nenhum delay artificial. [Procedimento oficial Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/splash-screen/). APK inicial descartado para distribuição; artefatos finais recompilados após a correção e alinhamento do centro do símbolo com a splash. Baseline v1.0.0 restabelecida antes do teste de upgrade final.

## Compilação e assinatura

APK e AAB gerados localmente por Gradle, release com JavaScript embarcado. Mesma chave de produção da v1.0.0 recuperada do EAS; assinatura de release substituída por init script temporário privado, sem utilizar debug keystore. Configuração/senhas fora do projeto, protegidas por ACL do usuário. Não executar assembleRelease sem a configuração privada: o template Android gerado possui assinatura debug por padrão.

A primeira tentativa local encontrou `Filename longer than 260 characters` no Ninja, em um objeto gerado de react-native-safe-area-context. Retomada com staging CMake em pasta temporária curta e `CMAKE_OBJECT_PATH_MAX=200`, somente no init script local. Nenhuma alteração de código/dependência por causa desse limite do Windows. Para reproduzir neste ambiente, aplicar também esses parâmetros temporários. [Bundletool oficial 1.18.1](https://github.com/google/bundletool/releases/tag/1.18.1) utilizado para validar o AAB.

Perfis EAS production (APK) e production-aab (AAB) mantêm credenciais remotas, versionamento local, sem autoIncrement/developmentClient.

Certificado de produção SHA-256: `02262f7e6606576ba250c9acf16425ae34749d141502000adc62c5729b796016`.

## Artefatos e validação da release

| Artefato | Caminho local | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| APK | release/Setority-v1.1.0.apk | 113291353 | `9357d1f4acf08ea7411013b8a9c98734a10b92344ab64457e7f40095e68709e3` |
| AAB | release/Setority-v1.1.0.aab | 77256237 | `a74a965659388732001aa01f3ed658727228f9ba418b194389cabb072515f041` |

APK: apksigner verify PASS, certificado igual à v1.0.0, package/versionName/versionCode corretos e debuggable=false pelo apkanalyzer. AAB: bundletool validate PASS, manifesto com mesmos valores e sem debug, jarsigner `jar verified`, certificado igual à v1.0.0 pelo keytool. Avisos de certificado self-signed/sem timestamp do jarsigner são próprios da assinatura Android, não falha criptográfica; certificado válido até 2054. Ambos contêm index.android.bundle e quatro ABIs (armeabi-v7a, arm64-v8a, x86, x86_64).

Última compilação: BUILD SUCCESSFUL, 1m47s, após ajuste do centro do Boot. A assinatura foi aplicada no Gradle durante assembleRelease/bundleRelease; keystore, senhas e init script privados removidos após verificação. Não existe credencial de assinatura no repositório.

## Upgrade real v1.0.0 → v1.1.0 — PASS

APK histórico assinado v1.0.0 instalado; conta criada pelo cadastro normal, onboarding mínimo concluído e fixture TESTE11C Upgrade preparada. Produto inicial20, saída antiga2 sem vendedor, saldo18. Para testar o artefato definitivo, baseline antiga restabelecida com a mesma fixture e login normal antes do upgrade.

APK definitivo instalado com adb install -r, sem desinstalar entre a v1.0.0 dessa baseline e a v1.1.0 final. Android retornou Success. Aplicativo aberto pelo launcher, sem URL de desenvolvimento ou Metro; port8081 sem listener. Abriu diretamente a Home autenticada, sem cadastro/onboarding. Comparação independente dos documentos antes/depois confirmou UID, perfil, estabelecimento, setor, produto e movimentos idênticos. Registros antigos sem vendedorNome carregaram normalmente, sem migração manual.

Vídeo da inicialização revisado por frames: splash nativa → Boot com v1.1.0 → Home; sem intervalo vazio relevante, símbolo alinhado e versão inferior esquerda legível. Não foi inserido delay para mostrar/capturar Boot.

## Smoke release — PASS

Home sem recentes, com métricas1 produto/1 setor/0 reposição/0 zerados e sem lacuna visual. Produto sem ação de exclusão permanente em ativo/inativo; inativar/reativar preservou saldo18/histórico e voltou às ações normais.

Entrada2 levou18→20; saída3 sem vendedor20→17; saída2 com vendedor17→15. Vendedor com espaços salvo trim; alteração Carlos Release→Joana Release manteve15 e apareceu em Movimentações. Remover vendedor manteve15; servidor confirmou ausência real do campo. Entradas sem opção/campo vendedor. Ledger final:20+2−2−3−2=15, cinco movimentos. Relatórios:22 entradas/7 saídas/saldo15. Conta: Versão1.1.0.

Saída1 com modo avião/Wi-Fi/dados desligados rejeitada com “É necessária conexão para registrar esta movimentação.”, sem sucesso falso. Após cancelar e restaurar rede: saldo15 e cinco movimentos intactos no servidor.

Ação rápida Saída abriu a busca de produto; cancelamento retornou à Home. Logout/login normal concluídos, com mesmo estabelecimento/dados, sem Metro. Logout final deixou Welcome. Launcher exibiu nome e ícone oficiais e abriu a release diretamente.

Logcat do PID durante o smoke e buffers crash/events: sem FATAL EXCEPTION, ANR, crash ou Error/Warning ReactNativeJS originado no app. Ao fechar/trocar a árvore da sessão, reapareceu a mensagem recuperável NativeAnimatedNodesManager, “Native animation workaround, frame lost as result of race condition”, com Illegal node ID em Animated.Add, já examinada na11B. Origem provável na cadeia React Native/React Navigation, conforme stack/fontes documentadas na11B; fluxo continuou normalmente. Não é FATAL EXCEPTION e não motivou alteração de animações/dependências fora do escopo.

Cleanup estrito PASS: nove documentos sintéticos (cinco movimentos, produto, setor, perfil e estabelecimento) e uma conta Auth removidos, com coleções vazias/documentos404/usuário Auth ausente conferidos. Arquivo de credenciais da fixture e snapshot temporário removidos. Nenhum dado real, APK histórico, tag ou documentação v1.0.0 removido.

## Testes finais — PASS

- TypeScript sem erros.
- Expo Doctor 18/18 após dependência/configuração finais.
- Lógica/serviços/UI141/141 após último ajuste;138 da baseline preservados, mais testes de fonte única de versão, Boot/asset/safe area/erro/sem timer e liberação da splash somente com conteúdo, imagem e layout prontos.
- Rules Emulator551/551 após bump; fonte não mudou, auditor da11B não repetido. Nenhum deploy de Rules nesta etapa.
- Configuração pública Expo válida, assets existentes; diff check PASS.

## Android e evidências

Pixel_6_API_36 visível no monitor principal, canto direito, janela1066,60,1506,810; ADB device e boot1. Android Studio não aberto. Release x86_64 examinada em360×740, teclado e StatusBar dark. Evidências selecionadas em docs/validacoes/release11c-*.png: Boot, Home, saída com vendedor, movimentação com vendedor, Conta e launcher. Sem dezenas de capturas.

Resolução/densidade restauradas para1080×2400/420 após o smoke; chave temporária de handwriting removida, modo avião desligado e Wi-Fi/dados restaurados. Emulator permanece visível em Welcome. Galaxy A54 não apareceu no ADB: PENDENTE opcional.

## Estado final e publicação

Diff check PASS; staging contém somente código/configuração, testes, CHANGELOG, este documento e seis PNGs. APK/AAB, Android gerado, .env, senhas, keystore e intermediários não entram no Git. Release commit: `release: Setority v1.1.0`, identificado pela tag anotada `v1.1.0`, mensagem `Setority v1.1.0`. Nenhum push ou publicação externa.

A compilação usou cache CMake fora do repositório. Os arquivos privados de assinatura foram removidos após a verificação.

Pendências bloqueantes: Nenhuma.

SETORITY v1.1.0 APROVADO PARA DISTRIBUIÇÃO

## Limitações conhecidas

- Operações críticas exigem rede; abertura fria offline pode precisar confirmar perfil.
- Relatórios/histórico extensos usam agregação client-side; a regressão 11B examinou 400 movimentações, sem garantia de SLA.
- Android é a plataforma validada; iOS não validado; Web sem Firebase nativo.
- Galaxy A54 não conectado ao ADB nesta execução: PENDENTE opcional, conforme pedido, sem bloquear a release.
- A 11B observou mensagens recuperáveis da cadeia React Native 0.81.5/React Navigation sobre animação nativa, sem crash ou falha funcional; não houve mudança dessas dependências nesta etapa.

Nenhum push, GitHub Release, Play Store, EAS Update ou publicação automática. APK/AAB, credenciais e builds intermediários não são versionados no Git.
