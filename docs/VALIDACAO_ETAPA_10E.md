# Etapa 10E — hardening técnico e regressão final

As evidências complementares desta validação integram o acervo interno do projeto.

Regressão em 06/10/2026; recuperação de senha concluída em 07/10/2026. Resultado: **ETAPA 10E APROVADA — RELEASE CANDIDATE**. Pendência bloqueante de recuperação encerrada. Galaxy A54 pendente de conexão, sem bloquear sozinho esta etapa.

## Checkpoint 10D e baseline

Antes de iniciar a 10E: TypeScript PASS; Expo Doctor 18/18; lógica/serviços 98/98; Rules 498/498; `git diff --check` PASS. A 10D foi registrada no commit `f8ae9d1362dfdb0b8a49e9492306790da2ed312f` (`chore: finaliza polimento de interface e experiencia`), com 37 arquivos. Working tree limpa após o commit. A 10E permanece sem commit.

| Item | Baseline verificada |
| --- | --- |
| Node / npm | 24.19.0 / 12.2.0 |
| Expo / React Native / React | 54.0.37 / 0.81.5 / 19.1.0 |
| RN Firebase app/auth/firestore | 26.4.0 / 26.4.0 / 26.4.0 |
| TypeScript | 5.9.3 |
| Android package | `com.murilo.estoqueporsetores` |
| Firebase project | `controle-de-estoque---tcc` |
| Firestore | `(default)`, Standard, Native, `southamerica-east1` |
| AVD / dispositivo | `Pixel_6_API_36` / `emulator-5554`, boot 1 |
| Development build | Native Firebase, Metro existente na porta 8081, ADB reverse |
| Janela do Emulator | 440 × 750; retângulo 1066,60–1506,810; visível dentro da WorkingArea principal 1536 × 816 |

`npm ls --depth=0` confirmou árvore coerente. Config pública Expo confirmou SDK 54, pacote Android, `google-services.json`, plugins RNFB app/auth, expo-font e expo-build-properties. RNFB Firestore 26.4 não fornece config plugin próprio. Nenhum pacote, lockfile, SDK, AVD, projeto Firebase ou configuração nativa foi atualizado/regenerado.

## E2E principal e consistência independente

Conta A criada pelo formulário Android; onboarding, setor e produto criados pela UI. Nenhuma escrita administrativa ou ajuste manual do Firestore foi utilizado para fazer o E2E principal passar. REST autenticado leu somente as fixtures próprias para conferir os resultados.

Após cada etapa, a verificação independente somou entradas e saídas de todo o histórico por produto, comparou com `estoqueAtual`, exigiu saldo não negativo e conferiu contagem de movimentos e contador de produtos do setor.

| Operação na UI | Saldo esperado/observado | Histórico principal |
| --- | --- | --- |
| Produto com inicial 10 e mínimo 12 | 10 | 1 |
| Entrada +5 | 15 | 2 |
| Saída −4 | 11 | 3 |
| Editar entrada 5 → 6 | 12 | 3 |
| Editar saída 4 → 3 | 13 | 3 |
| Cancelar exclusão | 13 | 3 |
| Excluir entrada de 6 | 7 | 2 |
| Excluir saída de 3 | 10 | 1 |
| Inativar | 10, inativo | 1 |
| Reativar | 10, ativo | 1 |
| Nova entrada +1 após reativação | 11 | 2 |
| Logout e novo login A | 11 | 2 |
| Entrada offline negada, reconexão e retry único +1 | 12 | 3 |
| Corte durante envio, erro e retry único +1 | 13 | 4 |

PASS: criação inicial usa movimento de entrada, sem dupla soma da quantidade inicial. Edição substitui a contribuição antiga. Reposição acompanha `saldo <= mínimo`, incluindo igualdade em 12. Histórico e saldo permanecem preservados no ciclo. Inativação desabilitou Entrada, Saída, Editar e Excluir movimentação; histórico continuou acessível. Exclusão permanente do produto histórico foi bloqueada.

## Concorrência e Security Rules

PASS: 500/500 cenários no Emulator local `demo-estoque-local`; preservados os 498 anteriores. Acrescentados dois cenários com commits concorrentes a partir da mesma versão, confirmação única inicial, releitura, retry com ID estável e soma independente do histórico:

- Duas entradas +5/+7 sobre saldo 10: saldo final 22, três movimentos.
- Edição da entrada inicial 10 → 12 contra nova saída de 3: saldo final 9, dois movimentos.

Cobertura preservada: saídas 8/7 contra saldo 10, edição de saída contra nova saída e exclusão de entrada contra nova saída. O perdedor é reavaliado; operação que produziria saldo negativo é negada. Nenhum saldo negativo ou divergência foi observado.

Skill `firebase-security-rules-auditor`: [avaliação JSON](AUDITORIA_RULES_ETAPA_10E.json), score 5 no escopo revisado, sem bypass reproduzido. Anônimo, sem perfil, A/B, writes diretos de saldo, movimentos incoerentes, manipulação de identidade/status/auditoria, reversão de `possuiHistorico`, operações em inativos, delete permanente histórico/legado e RN-08 estão cobertos. A pontuação não equivale a prova exaustiva.

Rules remotas comparadas ao arquivo local após normalizar CRLF/LF: iguais. Não houve alteração de Rules nem deploy.

## Isolamento A/B e conta

PASS no fluxo realizado: B foi criada pela UI, abriu Home vazia, criou setor/produto próprios com inicial 3, consultou Inativos vazio, global e relatório com entrada 3. A → logout → B → logout → A voltou ao saldo 11 e catálogo de A. Confirmação de logout cancelada preservou a sessão; confirmação executada retornou ao Login. Dados da conta corresponderam à sessão.

No Firebase real, 16 leituras autenticadas cruzadas foram negadas com HTTP 403: get/query de setores, produtos e movimentações, perfil e estabelecimento, nos dois sentidos. As consultas não usaram credenciais administrativas. Tests de sessão/listeners também verificam a janela de render anterior ao cleanup e callbacks tardios, complementando a observação nativa de ausência de dados antigos.

## Home, relatórios e volume

Criados pela UI dois produtos adicionais: Sem movimento (inicial 0/mínimo 0) e Volume (inicial 0/sem mínimo). Home antes da carga: 3 produtos, 1 setor, 2 reposições e 2 zerados, conforme cálculo independente.

Fixture de carga separada do produto principal: 400 operações autenticadas, alternando entrada 2 e saída 1. Cada commit respeitou Rules, delta atômico, schema, autoria, timestamps e precondição de versão. Nenhum bypass administrativo foi utilizado na carga. Resultado independente: entradas 400, saídas 200, saldo 200, 400 movimentos; criação inicial permaneceu zero.

Relatório Android, período 01/10–06/10: entradas 411, saídas 200, saldo do período 211, 402 movimentos e 2 produtos movimentados. Ranking de entradas: Volume 400, principal 11. Filtro saída: 0/200; entrada: 411/0; setor + produto principal + entrada: 11/0. Limpar filtros restaurou o conjunto completo. Histórico inativo permaneceu no relatório; indicadores atuais excluíram inativos.

PASS no volume Android: global ampliada de 50 até 450 e rolagem até os registros principais mais antigos; detalhes do produto de volume com saldo 200, movimento 400 no topo e movimento 001 acessível ao final. Home após carga: 3 produtos, 1 setor, 2 reposições, 1 zerado.

O teste de volume local adicional preservado usa 400 movimentos/20 produtos e confirma agregação completa. O teste nativo não é benchmark de release nem SLA. Relatórios agregam no cliente e consultam todas as movimentações do período; detalhes consultam o histórico completo. Global amplia o limite de consulta em blocos de 50, sem cursor. Ampliar/renovar a consulta pode reiniciar a rolagem. Essas estratégias foram preservadas; escala muito maior exige avaliação própria.

## Datas e listeners

PASS nos testes: início inclusivo, fim exclusivo, último microssegundo do dia, virada de mês, bissexto, fuso São Paulo/Tóquio, dias locais de 23/25 horas e rejeição de datas inválidas/invertidas. Android observado em GMT, data 06/10/2026; calendário local do dispositivo define os limites. Nenhuma estratégia de datas foi alterada.

Hooks revisados: useSetores, useProdutos, useMovimentacoesProduto, useVisaoEstoque e useRelatorios. Cleanup em blur/unmount, troca de UID/estabelecimento/IDs/período/limite/retry; dados de sessão anterior são escondidos antes dos efeitos. SessionProvider encerra observador Auth e usa versão para rejeitar respostas antigas. Home/global/relatórios usam três consultas fixas; associação de nomes em memória, sem N+1. Tests verificam fechamento idempotente, erros na aquisição, troca de conta e callbacks tardios.

## Recuperação e Firebase

PASS para validação e envio nativo: vazio e formato inválido mostraram mensagens em português; email com espaços nas extremidades foi normalizado; envio rápido repetido foi bloqueado; Firebase aceitou solicitação para caixa real autorizada e app mostrou a mensagem genérica prevista. Teclado e retorno ao Login conferidos em 360 × 740. Testes cobrem loading, unmount, lock do serviço e traduções de conexão, muitas tentativas, email inválido e indisponibilidade.

**Recuperação de senha: PASS.** Em 07/10/2026, novo pedido enviado pelo Login → Esqueci minha senha? para a caixa real autorizada. A conta já existia; antes do envio, Conta confirmou o email informado e estabelecimento TESTE, dispensando novo cadastro/onboarding. Logout e envio ocorreram pelo aplicativo, mantendo o Emulator visível à direita.

O usuário conferiu a própria caixa postal e confirmou: email recebido em português, redefinição concluída com sucesso e login funcionando somente com a nova senha. Essa confirmação comprova recebimento, idioma, link funcional, troca concluída e rejeição da senha antiga. A caixa postal não foi acessada pelo agente; nenhuma senha foi solicitada no chat ou inserida em comandos, logs ou arquivos do projeto.

Após essa confirmação, o usuário digitou a nova senha diretamente no Android Emulator e entrou. O agente observou Home autenticada e conferiu Conta: mesmo email e estabelecimento TESTE da referência anterior, sem novo onboarding. Perfil/estabelecimento preservados na sessão validada. A evidência da senha antiga rejeitada é a confirmação manual do usuário; o login novo e a preservação da sessão também foram observados no emulador. A conta real não faz parte do cleanup sintético.

Consulta remota somente leitura: projeto ACTIVE; Auth Email/Password enabled/passwordRequired; improved email privacy true; sendEmail DEFAULT; reset template HTML presente; callback oficial `/__/auth/action`. Default locale remoto en; app usa `setLanguageCode(auth, 'pt')` antes do envio. Nenhuma alteração de template/provider foi necessária. Índice de movimentações com estabelecimentoId ASC/criadoEm DESC/__name__ DESC, COLLECTION, READY, coerente com o arquivo local.

## Dependências, segredos e código

`npm audit`: 59 alertas (1 low, 16 moderate, 40 high, 2 critical), ante 55 documentados na auditoria anterior (1/14/38/2). Não são 59 falhas independentes do APK; contagem inclui pais transitivos. Nenhuma mudança de dependências ocorreu na 10E; não se atribuiu a diferença a uma causa única sem evidência.

| Caminho | Avaliação no aplicativo atual |
| --- | --- |
| RN → react-devtools-core → shell-quote | Critical em escaping de comandos Node; risco em tooling com tokens de operadores controlados externamente. App não executa shell. [Advisory primário](https://github.com/advisories/GHSA-w7jw-789q-3m8p). |
| Expo → CLI → tar | Critical de exaustão ao extrair entradas não confiáveis no ambiente de desenvolvimento/build; não usado por cadastros/movimentos Android. [Advisory primário atual](https://github.com/advisories/GHSA-23hp-3jrh-7fpw). |
| Navigation → nanoid/non-secure | Gerador presente em runtime; chamadas inspecionadas usam tamanho padrão 21, sem tamanho externo/negativo nem custom generator vulnerável. Não foi reproduzida a condição do advisory no fluxo atual. [Advisory primário](https://github.com/advisories/GHSA-28wg-ghj8-5hjv). |
| query-string → decode-uri-component | Potencial DoS por URI malformada; NavigationContainer atual não habilita linking externo. [Advisory primário](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). |
| Metro/CLI/XML/PostCSS/forge/Node ws-undici-gRPC/SDK web transitivo | Predominantemente tooling ou implementações Node/web; o fluxo Firebase Android usa SDK nativo RNFB. Presença transitiva não prova exploração em cada fluxo nativo. |

O risco no tooling permanece e merece atualização compatível em trabalho específico; não é declarado inexistente. Nenhum audit fix, force, upgrade ou override novo foi executado.

Scan mascarado inicial de 278 arquivos versionados e final incluindo novos arquivos (301 caminhos): zero ocorrências de chave privada, conta de serviço, private_key ou token longo persistido nos padrões textuais examinados. As 21 capturas foram conferidas separadamente; não incluem senhas ou tokens. Config pública cliente Firebase não é credencial administrativa. Nenhum valor sensível foi exibido. `.env`/credenciais temporárias não foram versionados.

`rg` não encontrou any/as never/ts-ignore/ts-expect-error, dumps console, AsyncStorage/localStorage/sessionStorage ou tipos/telas locais antigos em src. Casts restantes dos conversores acompanham validação de schema/tipo; `ids as string[]` valida todos os elementos antes; `as Estado` representa loading da união discriminada. TypeScript adicional com noUnusedLocals/noUnusedParameters passou. Nenhum código foi removido sem prova de inutilidade.

Exportação web gerada em diretório temporário: PASS. Continua mostrando indisponibilidade do Firebase nativo; iOS continua pendente de configuração/build Apple. Não foram introduzidos fallback web ou suporte iOS.

## Offline e retry

PASS no Android: Home mostrou dados já sincronizados e aviso de cache; produtos/detalhes/histórico permaneceram consultáveis; relatórios mostraram aviso explícito de possível desatualização/incompletude. Wi-Fi e dados móveis foram desabilitados no Emulator; o host continuou online somente para a conferência independente do servidor.

Com o produto de volume inativado previamente pela UI online, reativação offline foi negada. No produto principal, saída, edição, exclusão, inativação e entrada offline foram negadas, com mensagens em português e sem sucesso falso. Após cada tentativa, Firestore permaneceu com 402 movimentos e principal 11/Volume 200. O formulário de entrada permaneceu disponível para retry; ao reconectar e tocar rapidamente duas vezes, confirmou exatamente uma entrada de 1: principal 12, total 403 movimentos, observação de retry encontrada uma única vez. Reativação online do produto de volume preservou saldo 200 e seus 400 movimentos. Não foi criada fila/cache paralelo.

PASS no corte durante operação: rede desligada imediatamente após tocar Confirmar entrada; app permaneceu no formulário com erro traduzido e nenhum movimento foi confirmado naquela tentativa. Reconectar e retry rápido confirmaram uma única entrada de 1, observação de interrupção encontrada uma vez, principal 13 e total 404 movimentos. Conferência independente confirmou saldo/histórico. Lista de setores também foi reaberta sem rede e exibiu o setor já sincronizado.

## Retomada, navegação, datas nativas e exclusão sem histórico

PASS: force-stop com conta A online, corte de rede, abertura da development build. Auth preservou a conta, mas perfil/estabelecimento não confirmados no servidor mantiveram o acesso bloqueado em “Não foi possível carregar sua sessão”. Nenhuma tab de estoque ou onboarding foi liberada. Reconectar e Tentar novamente restauraram Home/saldo 12. A limitação arquitetural foi preservada.

PASS: fechar/reabrir online a partir de Home, lista de produtos, detalhes e relatórios retornou à Home da conta A, sem rota órfã, nova sessão, loop ou saldo perdido. O app não promete persistir a pilha de rotas.

PASS: período nativo 06/10–06/10 incluiu todas as 403 movimentações (entradas 412/saídas 200); 05/10–05/10 retornou 0/0; 31/02 mostrou validação sem alterar dados. Produto Sem movimento apareceu na seção correspondente. Cancelar exclusão permanente preservou três produtos; confirmar removeu somente o produto sem histórico: dois produtos, 403 movimentações, contador do setor 2. Home após exclusão: dois produtos, um setor, uma reposição, zero zerados.

PASS observacional no volume verificado: 24 ciclos de quatro tabs (96 trocas) sem travamento, crash, duplicação de eventos percebida ou perda de navegação. PSS nos três grupos de oito ciclos: 409646, 434939 e 441485 kB (aproximadamente 400, 425 e 431 MiB); incremento do último grupo cerca de 1,5%. Views 757/757/753, Activity 1 e ViewRootImpl 1 nos três pontos. PSS variou com alocações/caches; não foi observado crescimento de instâncias ou degradação evidente. Não é prova de ausência de leaks, profiling de heap ou benchmark de release. Nenhuma micro-otimização realizada.

## Conferência final, Conta e logs

Após o retry da interrupção de rede, conferência independente e relatório nativo concordaram: entradas 413, saídas 200, saldo 213, 404 movimentos e dois produtos movimentados. Produto principal 13 e Volume 200. Home: dois produtos, um setor, zero reposições e zero zerados. Igualdade ao mínimo 12 havia destacado reposição; saldo 13 deixou de destacar.

Conta mostrou o email correto da sessão A; cancelar redefinição preservou a tela e confirmar enviou pelo Auth, com mensagem genérica. Logout exigiu confirmação e retornou ao Login. Em 07/10/2026, a recuperação real foi concluída com confirmação do usuário e login nativo observado, conforme seção Recuperação e Firebase; não se equiparou somente envio aceito a redefinição concluída.

Logcat coletado durante a regressão: nenhum FATAL EXCEPTION, ANR do app, warning/error ReactNativeJS relevante, aviso de lista vertical aninhada, navegação não serializável ou atualização após unmount encontrado nos filtros examinados. Avisos de conectividade/UNAVAILABLE do SDK durante os cortes de rede são esperados; a UI traduziu os erros. Resultado observacional, limitado à sessão e filtros coletados.

## Android, Galaxy A54 e cleanup

Emulator permaneceu visível no canto direito do monitor principal durante os testes. Validação em 360 × 740 por ajuste temporário; ao terminar, resolução e densidade originais restauradas (1080 × 2400, 420), configuração temporária do teclado removida e rede restabelecida. Janela reconfirmada visível e dentro do monitor; ADB device, boot 1. No complemento de 07/10/2026, o AVD existente foi iniciado com no-snapshot-load e reposicionado explicitamente. Durante a inicialização houve alerta do System UI do Android; escolher Wait permitiu retomar. Login/reset concluídos em resolução original, sem alteração do aplicativo ou do AVD para contornar esse alerta. Emulator permanece aberto na Conta autenticada após o novo login.

Galaxy A54: **PENDENTE**. Usuário informou disponibilidade, mas ADB mostrou somente emulator-5554; nenhum teste físico foi realizado. Não se atribui PASS ao aparelho. A validação física reduzida poderá ser feita após a conexão.

Cleanup **PASS**, limitado às duas fixtures com prefixo TESTE 10E, emails sintéticos e vínculos/autor conferidos antes da exclusão. Conta A: 404 movimentos, dois produtos e um setor; conta B: um movimento, um produto e um setor. Consultas finais retornaram zero documentos nessas coleções. Os dois perfis, estabelecimentos e usuários Auth foram removidos e sua ausência confirmada; arquivo temporário de credenciais apagado. Conta real preservada. Limpeza administrativa de fixtures não modifica o comportamento de exclusão de produtos do aplicativo.

## Arquivos e evidências

- `tests/firebase-rules.test.cjs`: dois cenários adicionais de concorrência, preservando os 498 existentes.
- [Auditoria das Rules](AUDITORIA_RULES_ETAPA_10E.json): resultado estruturado e limites.
- Este relatório e 21 capturas PNG de 360 × 740 em `docs/validacoes/etapa10e-*.png`.

Evidências selecionadas: inicial 10, edições, inativo, relatório de volume, filtros combinados, fim do histórico, fim da lista global, Home offline, relatório offline, erro na interrupção, Home após retry, relatório final, redefinição solicitada.

## Checks técnicos executados na 10E

TypeScript PASS; Expo Doctor 18/18; lógica/serviços 98/98; Rules 500/500 (498 preservados + dois novos); auditor JSON score 5, nenhum bypass reproduzido no escopo; Android E2E PASS; web export PASS; diff --check PASS. Git status contém somente o teste e novos documentos/evidências; HEAD permanece no checkpoint 10D. Não houve correção em código do aplicativo, configuração, layout ou Rules. Alterações restritas a duas lacunas de testes de concorrência e documentação/evidências. Nenhum commit 10E, deploy, upgrade ou preparação de release realizado.

Complemento de 07/10/2026, somente regressão mínima: `npx tsc --noEmit` PASS; `node --test tests/auth.test.cjs tests/recuperacao-senha.test.cjs tests/conta.test.cjs` 26/26 PASS, zero falhas; `npx expo-doctor` 18/18 PASS; `git diff --check` PASS. A regressão completa anterior não foi repetida. Nenhuma mudança em UI, Rules, Firestore, regras de negócio ou dependências; somente este documento atualizado no complemento. Sem commit, 10F ou release.

## Correções, limites e pendências bloqueantes

Correções de bugs: nenhuma; não foi reproduzido bug do aplicativo que exigisse alteração nesta etapa.

Limites conhecidos preservados: escritas críticas exigem rede; abertura fria offline exige confirmar perfil no servidor; agregação de relatórios e histórico completo no cliente; consulta global amplia limite sem cursor; medições de memória/volume são observacionais em development build; web sem Firebase nativo e iOS sem validação Apple; riscos de dependências no tooling permanecem documentados. A auditoria não é prova exaustiva de segurança/performance.

Pendências bloqueantes: **Nenhuma.** Recuperação real confirmada pelo usuário em 07/10/2026; login com nova senha e preservação de perfil/estabelecimento também observados no Emulator. Galaxy A54 continua como validação física pendente não bloqueante; não se atribui PASS ao aparelho.

**ETAPA 10E APROVADA — RELEASE CANDIDATE**
