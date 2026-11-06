# Etapa 11B — regressão e validação da futura Setority v1.1.0

Data: 13/10/2026. Branch: `codex/etapa-11b`.

## Commit da 11A e preservação da v1.0.0

Antes de alterar arquivos: TypeScript PASS, Expo Doctor 18/18, lógica/serviços/UI 124/124, Rules Emulator 547/547, diff check PASS. Criado somente o commit autorizado da 11A `43a979c371b3942fd18688365258663bf0705279` (`feat: adiciona melhorias planejadas para v1.1.0`), com 40 arquivos. Working tree vazia antes de iniciar a 11B.

Tag v1.0.0 continua no checkpoint `417e401b9a21fded7544118c631c85a6cc8cbe17`. Documentação RELEASE_1.0.0.md intacta, APK histórico preservado. Version/versionCode permanecem 1.0.0/1; CHANGELOG mantém Unreleased 1.1.0. Nenhuma build APK/AAB nova, tag, release, commit final 11B ou início da 11C.

## Escopo e método

Regressão de RF-01/02, setores/produtos/ciclo, RF-12..22, RN-03/04/08/10..14 e responsividade/acessibilidade. A proibição atual de exclusão de produto prevalece sobre requisitos históricos de delete. Não há feature, redesenho, alteração de Firebase Auth, navegação, modelo ou regra de negócio.

Usado development build x86_64 existente, com Metro, Pixel_6_API_36 visível no monitor principal, canto direito `1066,60,1506,810`. Device/boot 1 conferidos. Android Studio não aberto. Contas sintéticas 11B isoladas A e B; A criada pelo fluxo Android, B pelas APIs normais de Auth/onboarding/Firestore com validação das Rules. Nenhuma senha exibida no relatório.

## Evidência já concluída

- Home somente dois listeners, sem query de recentes; quick actions existentes Novo produto/Entrada/Saída mantidas. Não existe botão literal Nova Movimentação no layout aprovado.
- Delete de produto não encontrado na UI/API normal; Rules `allow delete: if false`.
- Checkbox usa touchTarget real do tema, 48dp; role, checked, disabled e label clicável verificados.
- Acesso direto A/B e B/A negado para perfil, estabelecimento, setor, produto e movimento, incluindo edição de vendedor cross-tenant.
- Ledger de A: inicial 25 + entrada 5 =30; saída 10 sem vendedor =20; saída 5 com vendedor Carlos Henrique =15; editar somente vendedor Joana mantém 15; editar quantidade 5→7 e vendedor Carlos =13; remover vendedor mantém 13, com ausência real do campo no servidor.
- Relatório antes/depois de editar somente vendedor: entradas30, saídas15, saldo15, quatro movimentações e estoque15; números idênticos por cálculo independente sobre documentos persistidos.
- Validações UI: checkbox vazio, espaços e 81 caracteres bloqueados; trim de Carlos Henrique preserva capitalização.

## Falhas durante a execução e análise

A primeira versão do teste REST concorrente esperava sempre HTTP409 no perdedor. O Emulator pode negar a proposta sobre snapshot obsoleto com HTTP403 (a avaliação negativa reportou o limite de expressões). Releitura mostrou updateTime do produto alterado; o harness foi corrigido para reavaliar somente conflitos comprovados, nunca ignorando negação sobre estado atual. Os três cenários passaram sem alterar Rules. Isso não amplia permissões do aplicativo.

Uma digitação automatizada encontrou momentaneamente o campo ausente após mudar a mensagem de validação/layout. Campo presente na inspeção seguinte; reforçado retry do helper temporário de UI e retomado o formulário. Nenhuma correção no código do app foi necessária.

## Status de execução

Validações concluídas: Android E2E, offline real, A/B/A, volume, vinte ciclos, responsividade, auditoria e cleanup PASS. Apenas smoke opcional no Galaxy A54 permanece pendente, pois o aparelho não está conectado.

## Android online — concluído

O E2E completo passou pelo aplicativo: Login, Home, Estoque, setor, produto, entrada inicial/adicional, saída sem vendedor, saída com vendedor, edição de quantidade, alteração/remoção do vendedor, nova saída com vendedor, inativação/reativação, Movimentações, Relatórios, Conta, Logout e novo Login. Confirmação posterior de saldo 10 e quatro documentos de movimentação persistidos.

Nome de 80 caracteres com espaços nas pontas foi aceito e salvo trim, sem mudar capitalização. Em 411×891, scroll mantém botão Confirmar saída acima do teclado aberto. Em 360×740, formulário/erros/teclado acessíveis. Nome completo envolve linhas no histórico, sem placeholders para entradas ou saídas antigas sem vendedor.

Produto inativo: ações Entrada/Saída disabled, estoque 10 preservado, histórico/setor/relatório mantidos, sem botão de delete. Home passa a excluir o produto inativo das métricas atuais. Reativação mantém10 e libera movimentação. Rules ativas negam delete de produto e setor com produto.

Exclusões individuais: saída 3 com vendedor removida →13; entrada 5 removida →8; entrada 2 após reativação →10. Ledger final: 25+2−10−7=10. Vendedor não interfere em edição, exclusão ou soma. Documentos antigos equivalentes (inicial e saída sem campo) renderizam, editam e participam de relatório sem migração.

Logcat do PID do aplicativo examinado após o fluxo online: nenhum FATAL EXCEPTION, ANR, ReactNativeJS Error/Warning relevante. O aparelho Galaxy A54 não aparece em adb devices; smoke físico pendente opcional, sem bloquear a 11B conforme pedido.

## Verificações finais locais

TypeScript PASS; Expo Doctor 18/18 PASS; lógica/serviços/UI 138/138 PASS; Rules Emulator 551/551 PASS; Auditor 5/5 no escopo examinado, sem bypass crítico; diff check PASS. Novos testes exercitam ledger completo, seis operações offline sem mutação, releitura após concorrência em edição, invariância de relatórios, vinte ciclos de cleanup/callbacks tardios e concorrência real com precondições.

Nenhuma alteração em src/, firestore.rules, app.json, package.json ou RELEASE_1.0.0.md na 11B. Somente testes/documentação/evidências. Rules ativas iguais à fonte local; redeploy NÃO NECESSÁRIO. Cobertura 547 anterior preservada e ampliada para 551. Fixture do teste de volume 400 mistura 200 entradas,100 saídas sem vendedor e100 com vendedor, com totais400/200/saldo200.

## Offline real — PASS

Android sem rede: modo avião ativado, Wi-Fi/dados desligados, `dumpsys connectivity` confirmou Active default network: none. Metro por adb reverse permaneceu acessível. Home, produtos/setores, histórico/global e relatórios exibiram dados já armazenados; banners de cache da Home/global e aviso próprio do relatório conferidos. Relatório em cache:27/17/saldo 10/quatro movimentações.

Saída sem vendedor, saída com vendedor, edição de vendedor, edição conjunta de quantidade/vendedor, inativação e reativação foram rejeitadas, com feedback de erro e sem sucesso falso. Servidor permaneceu com quatro movimentações, vendedor ausente e saldo 10. Para testar reativação offline, a inativação foi feita online entre cenários; reativação offline falhou, e só reativar online concluiu. Ao final, rede restaurada e produto ativo/saldo 10.

## Volume e relatório independente

Criada fixture adicional isolada: 400 movimentos num produto Volume (200 entradas de 2, 100 saídas de 1 sem vendedor, 100 saídas de 1 com vendedor). Somatório independente: 400−200=200; projeção do produto: 200. Criados ainda produto ativo zero/sem histórico, inativo zero/sem histórico e legado sem campos de ciclo, exclusivamente para leitura/negação de delete. Nenhuma migração de dados reais.

Relatório conhecido de A após fixture: entradas 427, saídas 217, saldo 210, 404 movimentos; maior entrada 400 e maior saída 200 do produto Volume; dois produtos ativos sem movimento e três em reposição. Antes/depois de editar somente vendedor de um movimento via API cliente normal, todos esses números, estoques e rankings idênticos. Delete cliente negado para todos os cinco produtos e para seu setor. Fixture de volume inserida administrativamente apenas no estabelecimento sintético verificado; criação/interações do E2E principal usaram o fluxo normal do app.

## Volume no Android — PASS

Global abriu os registros de volume e o botão Carregar mais foi acionado (50→100). Queries cliente reais 50/100/400 confirmaram datas decrescentes, prefixos de paginação preservados, IDs únicos e estabelecimento correto. Histórico do produto Volume abriu com estoque 200 e Vendedor: Volume Carlos. Relatórios renderizaram 427/217/saldo 210/404 movimentos/dois produtos movimentados, em acordo com cálculo independente. Produtos sem movimentação e alertas acessíveis por rolagem.

Home com fixture: quatro produtos ativos, um setor, três em reposição, dois zerados; produto inativo não contado. Sem recentes ou espaço substituto. Produto legado sem status/marcador de histórico lido como ativo, sem alteração nos documentos antigos. Nenhum crash/ANR/aviso relevante no log do app ao navegar no volume.

Limitação de automação corrigida: a lista de produtos preservava posição de rolagem, e o gesto genérico de voltar ao topo começava no header fixo, fora da lista. Refeito o gesto dentro da área rolável; produto Volume abriu e retorno ao produto principal passou. Nenhuma mudança de layout ou código do app.

## Listeners e desempenho

Auditoria: Home usa limite 0, só produtos/setores, sem query escondida de recentes. Global usa limite positivo ordenado por criadoEm e paginação; cleanup em blur, mudança de limite, sessão e retry. Hooks de produtos/histórico/relatório possuem guard ativo e chave de contexto para ignorar callbacks após unmount/troca A/B. Testes exercitaram 20 ciclos de criação/cleanup de listeners e callbacks tardios, sem duplicação/publicação indevida.

A comparação com Home anterior é qualitativa/estrutural: grupo específico da Home caiu de três consultas para duas; não foi executado benchmark controlado do APK 1.0.0. Tempo das automações inclui ADB/UIAutomator e não mede latência pura do app. Volume local no Firestore Emulator: leitura completa 1376 ms e transpile+agregação 332 ms, apenas indicativo deste ambiente, sem SLA.

Vinte ciclos reais Home↔Estoque↔Movimentações↔Relatórios concluídos, com o volume carregado, sem degradação perceptível/travamento/crash. Primeiros seis ciclos com leitura duplicada da automação; restantes 14 usam posições das abas obtidas do snapshot e conferem cada tela após tocar. Medições não comparáveis entre esses dois modos; ciclos otimizados ficaram entre 16089 e 19674 ms por quatro telas, incluindo overhead da automação. Não constituem benchmark de latência do app.

## Android A → B → A — PASS

Login B realizado após logout A; Home/Estoque/Global/Relatórios/Conta exibiram somente o contexto B. Global mostrou saída−1 com Vendedor: B Carlos e entrada+7, sem Volume Carlos/A; servidor confirmou produto B com saldo 6 e dois movimentos. Conta exibiu estabelecimento B. As tentativas diretas A/B e B/A foram repetidas após carregar o volume e continuaram negadas.

Uma leitura de conferência pelo helper de rede do host retornou fetch failed transitório; repetida imediatamente, passou. Não houve alteração de SDK/configuração ou falha do fluxo nativo associado.

Relatório B conferido no Android após a troca: sete entradas, uma saída, saldo 6, dois movimentos e um produto movimentado; valores próprios de B, sem registros/nomes do volume A. Logout B concluído. Retorno a A concluído: produto principal com saldo 10, Volume com 200, 404 movimentos de A e vendedores próprios; relatório 427/217/saldo 210. Conta A correta e vendedor B Carlos ausente. Logout final concluído.

## Cleanup e estado final — PASS

Excluídos exclusivamente os registros sintéticos verificados das contas A e B: 406 movimentações, seis produtos, dois setores, dois perfis e dois estabelecimentos (418 documentos), mais as duas contas Auth. Antes de remover: nomes na lista exata de fixtures, vínculo ao estabelecimento correto, criadoPor correspondente e estoque igual ao ledger. Após remoção: coleções filtradas vazias, perfil/estabelecimento 404 e usuários Auth ausentes. Arquivo temporário com credenciais apagado; nenhum dado real/desconhecido removido.

Emulador permanece visível no canto direito, Welcome após logout; device/boot 1. Resolução/densidade restauradas para 1080×2400/420; chave temporária de handwriting removida. Rede restaurada para modo avião desligado, Wi-Fi/dados ligados. Logcat final do PID examinado sem FATAL EXCEPTION, ANR ou ReactNativeJS Error/Warning relevante.

## Bugs e correções

Nenhum bug funcional confirmado no app ou nas Rules. Ajustes somente de teste: releitura de conflitos REST com status403 sobre snapshot comprovadamente obsoleto; matriz dos cinco estados de produto; tamanho de toque real 48dp no mock; fixture 400 com vendedores; ciclos/cleanup/callbacks tardios e invariância matemática. Helpers temporários de ADB ajustados para rerender de campo, banner específico do relatório, área rolável sob header fixo e re-seleção da aba Estoque que retorna ao topo da stack. Não houve alteração de UI, fonte, regra de negócio ou configuração.

## Arquivos para revisão

Modificados: tests/features-11a-ui.test.cjs, tests/firebase-rules.test.cjs, tests/visao-estoque.test.cjs.
Criados: tests/regressao-11b.test.cjs, docs/VALIDACAO_ETAPA_11B.md, docs/AUDITORIA_RULES_ETAPA_11B.json e capturas docs/validacoes/etapa11b-*.png.
Removidos do repositório: nenhum. Alterações 11B sem commit e sem staging. HEAD permanece no commit 43a979c da 11A. Sem release, APK/AAB novo, tag v1.1.0 ou início da 11C.

## Limitações e pendências

- Galaxy A54: PENDENTE opcional, não conectado via ADB; não bloqueia a 11B conforme pedido.
- Desempenho avaliado qualitativamente, com 400 movimentos e 20 ciclos; sem benchmark controlado do APK anterior ou garantia de SLA.
- Auditor 5/5 refere-se ao escopo e cenários examinados, não é prova exaustiva de segurança.
- Pendências bloqueantes: Nenhuma.

## Revisão ampliada de logs e observação não bloqueante

Sem FATAL EXCEPTION, ANR ou erro/aviso JavaScript relevante ligado a vendedorNome, deleteField, formulário ou cleanup. A leitura ampliada, incluindo tags nativas, encontrou mensagens recuperáveis NativeAnimatedNodesManager: Native animation workaround, frame lost as result of race condition, com Illegal node ID em Animated.Add/multiply nas transições. Não são crashes; ocorreram no ciclo de navegação/Conta/troca da árvore de sessão, com continuidade do fluxo e dados corretos.

Fonte instalada React Native0.81.5, ReactAndroid/src/main/java/com/facebook/react/animated/NativeAnimatedNodesManager.kt:699–707: captura JSApplicationCausedNativeException e continua, podendo descartar quadros. AdditionAnimatedNode.kt valida IDs nativos; CardStyleInterpolators.tsx da dependência @react-navigation/stack usa add/multiply. src/ não contém uso direto dessas operações. Origem provável na cadeia de transições React Navigation/driver nativo, inferência apoiada na stack e fontes, sem atribuir ao domínio de estoque ou afirmar diagnóstico exaustivo.

Três ciclos isolados Welcome→Login→Welcome passaram após cleanup, sem nova mensagem NativeAnimatedNodesManager na janela examinada. Avisos de teclado/renderizador/back dispatcher do Android também presentes, sem falha funcional observada. Classificados como observações da dependência/ambiente, não warning do código de negócio; não motivaram alteração de navegação, desativação de animações ou upgrade fora do escopo. Atenção para conferir no futuro build release da11C, sem iniciar essa etapa agora.

## Resultado

ETAPA 11B APROVADA — RELEASE CANDIDATE v1.1.0
