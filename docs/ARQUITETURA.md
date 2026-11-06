## Etapa 10C — Conta e autenticação (06/10/2026)

AccountButton reutilizado nos headers das quatro áreas abre ContaScreen no stack raiz, somente em authenticatedReady. As quatro abas permanecem. Conta usa conta.email e estabelecimento.nome já presentes no SessionProvider; não consulta Firestore. Logout fica em Conta com confirmação; a saída de onboarding/erro de sessão permanece acessível. SessionProvider, seu protocolo de invalidação/cleanup e as Rules não foram alterados.

Login/Cadastro mantêm as regras anteriores, agora com AppScreen, AppCard, AppInput, AppButton e feedback do Design System. RecuperarSenhaScreen valida e-mail obrigatório/formato/trim, mantém a caixa original (arquitetura não normaliza para lowercase), exibe loading/disabled e retorno ao Login. O serviço recuperarSenha existente centraliza sendPasswordResetEmail e setLanguageCode(auth, 'pt') do React Native Firebase 26.4.0. Bloqueios na UI e no serviço impedem pedidos simultâneos; finally libera retry após erro. O retorno de tela desmontada não publica feedback.

Conta confirma o envio para o e-mail conhecido, sem nova digitação. Ambos os fluxos exibem a mesma mensagem genérica, inclusive auth/user-not-found: “Se existir uma conta com este e-mail, enviaremos instruções para redefinir sua senha.” Erros comuns reutilizam tradução de Auth; recuperação possui mensagem específica de conexão e mensagens seguras de indisponibilidade. Offline não produz sucesso. Password reset não cria sessão, não modifica Firestore e não armazena senha/token manualmente. Firebase Auth gerencia o reset pela página oficial hospedada; não há backend próprio, SDK Web nem formulário de troca direta de senha.

Configuração remota consultada em modo somente leitura: Email/Password habilitado, proteção de enumeração habilitada, template padrão de password reset existente, envio DEFAULT e callback oficial do projeto. defaultLocale remoto permanece en; o app solicita pt por requisição. Não houve deploy/configuração externa na 10C. Recebimento em caixa postal e redefinição na página hospedada não são confirmados por testes com endereços example.test. Para conferir conteúdo entregue, usar caixa controlada e conferir Authentication → Templates → Password reset; se for desejado mudar também o idioma padrão remoto, selecionar português no Console. Essa personalização é opcional; nenhuma ação manual é exigida para habilitar o fluxo implementado.

Referências: [setLanguageCode](https://reference.rnfirebase.io/_react-native-firebase/auth/setLanguageCode.html), [Firebase Android — password reset](https://firebase.google.com/docs/auth/android/manage-users#send_a_password_reset_email). Evidências/checks: [VALIDACAO_ETAPA_10C.md](VALIDACAO_ETAPA_10C.md).

# Evolução posterior ao MVP — Etapa 10B

O MVP e a Etapa 10A permanecem registrados abaixo como histórico de decisões. A política atual da 10B substitui RN-07/RF-11 de exclusão destrutiva de histórico por **inativação**. O levantamento original não foi reescrito.

## Ciclo de vida e persistência

Produtos novos têm status ativo, inativadoEm/inativadoPor nulos e possuiHistorico booleano. Inicial zero nasce false; inicial positiva nasce true com a entrada inicial no mesmo batch. A primeira movimentação cria o histórico e grava true na mesma transaction. O marcador é irreversível, inclusive após excluir individualmente todas as movimentações. Não representa saldo nem substitui o histórico como fonte de verdade.

Inativar/reativar usa transaction com leitura atual do produto. Inativação positiva é permitida com aviso de saldo; grava timestamp do servidor e UID autenticado. Reativação limpa ambos os campos. Nenhuma transição altera quantidade inicial, saldo, mínimo, vínculos, registro técnico ou documentos de movimentação. Rules só permitem essas alterações de auditoria junto da transição correspondente.

O serviço, os formulários e as Rules bloqueiam criação, edição e exclusão de movimentações em inativos. Seleção de nova entrada/saída só apresenta ativos. Detalhes e histórico continuam acessíveis. Confirmações usam modal; inativação/reativação usam aparência neutra e exclusão usa confirmação destrutiva. FeedbackProvider informa sucesso/erro sem Alert nativo.

## Exclusão permanente e compatibilidade

Exclusão exige possuiHistorico explicitamente false, inicial/saldo/contagem de movimentos zero e registro vazio. Remove apenas o documento do produto e decrementa atomicamente o contador técnico do setor. Produto com marcador true permanece cadastrado, mesmo se o saldo e o histórico atual estiverem vazios.

Documento antigo sem status é interpretado como ativo. Marcador ausente é preservado como undefined no domínio (não false), para que a ausência seja distinguível: exclusão bloqueada com mensagem conservadora. O produto pode receber movimentações, ser inativado e reativado. A primeira nova movimentação grava true. Não existe migração em massa ou normalização para false. Conversores validam tipos dos campos presentes. Datas de inativação não são passadas às rotas.

O cascade antigo e seu validador foram removidos do serviço e das Rules; nenhum fluxo vigente pode excluir histórico junto com o produto. O registro técnico de até seis IDs foi mantido e renomeado para LIMITE_REGISTRO_MOVIMENTACOES: operações individuais de movimento e deltas ainda dependem dele, incluindo compatibilidade de documentos anteriores. Essa lista não limita a quantidade de movimentações nem autoriza exclusão do produto.

## Catálogo atual e relatórios históricos

A tela de produtos do setor separa Ativos/Inativos; a aba padrão é Ativos, incluindo legados sem status. Home conta produtos ativos, reposições e zerados ativos. Recentes e histórico global preservam movimentos dos dois estados e indicam Inativo.

Relatórios: totais do período, agrupamentos, produtos movimentados e rankings de entrada/saída mantêm inativos com movimentos no período. Reposição e zerados representam estado atual e incluem apenas ativos. **Sem movimentação** representa o catálogo ativo sem entradas/saídas no período, independente do filtro de tipo. Filtros nunca modificam documentos. Inativar não muda totais/rankings históricos.

RN-08 inclui produtos ativos **e inativos**: ambos pertencem ao setor e impedem excluí-lo. Inativação/reativação não decrementam contador. Arquivamento de setores pode ser uma evolução futura, fora desta etapa.

Validação e auditoria: ver docs/VALIDACAO_ETAPA_10B.md e docs/AUDITORIA_RULES_ETAPA_10B.json.

---

# Decisões técnicas do MVP

## Estado atual — auditoria final da Etapa 9

Auth, onboarding, setores, produtos, movimentos, histórico, reposição e relatórios
estão implementados. As seções de etapas abaixo registram decisões históricas;
menções a implementações futuras descrevem o momento da respectiva etapa.
Android development build foi recompilada e validada. iOS aguarda configuração
Firebase e ambiente Apple; web mostra indisponibilidade do SDK nativo.

Setores/produtos agora encerram listeners também no blur e renovam no foco,
com isolamento no render por usuário/estabelecimento/parâmetros. Histórico e
relatórios já seguem esse comportamento. Parâmetros de rotas omitem as datas
Date que os formulários não usam; datas do domínio/histórico são preservadas.
AsyncStorage e três arquivos sem importações foram removidos na auditoria.
Falhas de exclusão nos detalhes fazem a FlatList voltar ao topo, exibindo o erro
que antes podia ficar fora da área visível após rolar o histórico.

Cascade permanece limitado a seis movimentos, todos provados pelo registro de IDs.
Um registro parcial pode bloquear cascade mesmo abaixo de seis. Registrar,
editar e excluir movimentos individuais e consultar relatórios continuam disponíveis.
Nenhum backend novo, alteração do protocolo ou deploy de Rules na Etapa 9.
Ver [AUDITORIA_FINAL_MVP.md](AUDITORIA_FINAL_MVP.md).

Decisões aprovadas explicitamente no pedido da Etapa 2. Complementam os
requisitos e substituem orientações técnicas anteriores conflitantes; não são
apresentadas como transcrição do levantamento original.

- React Navigation mantido, com Stack e headers. Não usar Expo Router nesta fase.
- Contratos de domínio em português; vínculo único chamado `estabelecimentoId`.
- Authentication futuro: e-mail e senha. Cada usuário pertence a um único
  estabelecimento; um estabelecimento poderá ter vários usuários. Convites e
  gestão avançada de membros ficam fora do MVP.
- Primeiro acesso planejado: criar conta → criar estabelecimento → associar
  usuário → entrar. Recuperação de falha parcial será definida com Firebase.
- Coleções futuras de nível superior: `usuarios/{uid}`,
  `estabelecimentos/{estabelecimentoId}`, `setores/{setorId}`,
  `produtos/{produtoId}` e `movimentacoes/{movimentacaoId}`. Setores, produtos
  e movimentações terão estabelecimentoId explícito. Produto exige setorId;
  movimentação exige produtoId e setorId obtido do produto. Consultas e Rules
  deverão aplicar e validar o isolamento por estabelecimento.
- Contratos de domínio usam Date. O futuro serviço Firebase converterá timestamps
  na fronteira de persistência.
- Estoque atual = soma das entradas − soma das saídas. Movimentações são a fonte
  lógica de verdade. Um futuro estoqueAtual persistido será apenas projeção/cache
  transacional, reconstruível pelo histórico e nunca editável pelo usuário.
- Quantidades são inteiras e finitas: inicial/mínimo >= 0; movimento > 0.
  Frações e unidades como kg/litros/metros ficam fora deste MVP.
- Tipo entrada/saida de movimentação existente é imutável. Edição permite somente
  quantidade e observação; não troca produto, setor ou estabelecimento.
- Futuras operações que diminuam/recalculem saldo deverão validar, gravar o
  movimento e atualizar a projeção em uma operação atômica no Firestore.
  A implementação e a validação das garantias nas Rules ficam para etapa própria.
- Saídas, edições que reduzam saldo e exclusões de entradas exigirão confirmação
  do servidor ou permanecerão não confirmadas offline. Nunca confirmar
  definitivamente offline uma operação que possa produzir saldo negativo.

## Transição do protótipo local

Na Etapa 5, SetorLocal foi removido: setores usam o contrato definitivo e Firestore.
Na Etapa 6, ProdutoLocal e produtosStorage.ts também foram removidos. Produtos
e a consulta RN-08 usam somente Firestore. Dados antigos do AsyncStorage não são
migrados automaticamente, lidos nem apagados pelo novo fluxo.

Login e onboarding foram implementados na Etapa 4. Movimentações, projeção e
relatórios ainda não foram implementados. A migração deverá definir também o destino dos dados
locais existentes. Métricas/fuso de relatórios continuam pendentes.

## Infraestrutura Firebase — Etapa 3

A decisão desta etapa substitui a orientação anterior de Firebase JavaScript SDK
como implementação mobile principal: Android/iOS usarão React Native Firebase
e os SDKs nativos. React Navigation permanece. Expo SDK 54, React Native 0.81.5
e New Architecture habilitada foram preservados. Os módulos app, auth e firestore
utilizam a mesma versão 26.4.0; expo-dev-client e expo-build-properties foram
instalados pelo Expo nas versões compatíveis com o SDK.

React Native Firebase requer development build e não funciona no Expo Go.
app.json mantém os plugins existentes e acrescenta os plugins oficiais app/auth.
Firestore não disponibiliza app.plugin.js nessa versão, portanto não é listado
como Config Plugin. expo-build-properties configura useFrameworks dynamic no
iOS, conforme a integração atual com Swift Package Manager do React Native
Firebase 26. Nenhum diretório nativo ou build foi gerado nesta etapa.

### Associação Android — Etapa 3.1

A associação Android foi concluída com os recursos previamente criados pelo
usuário e conferidos pela CLI/MCP:

- Projeto: Controle de Estoque - TCC.
- Project ID: controle-de-estoque---tcc, projeto acessível e ativo.
- App Android: Controle de Estoque Android, registro ativo.
- Package definitivo: com.murilo.estoqueporsetores.
- expo.android.googleServicesFile: ./google-services.json.
- Alias default em .firebaserc: controle-de-estoque---tcc.
- Authentication: Email/Password habilitado, com senha obrigatória.
- Firestore: banco (default), edição STANDARD, tipo FIRESTORE_NATIVE,
  localização southamerica-east1.
- Rules restritivas implantadas exclusivamente nesse projeto e confirmadas
  novamente pela leitura das regras publicadas.

O google-services.json fornecido pelo usuário foi preservado integralmente.
Seu project_id e package_name coincidem com o projeto, o registro Android e a
configuração Expo. Ele permanece versionável neste projeto acadêmico, conforme
decisão explícita do usuário; não foi adicionado ao .gitignore. Esse arquivo é
configuração do cliente, não autenticação administrativa nem mecanismo de
segurança. A proteção depende de Authentication e Security Rules. Não foram
documentadas API keys nem criada inicialização Firebase JavaScript paralela.

Na Etapa 4, ios.bundleIdentifier foi reservado como com.murilo.estoqueporsetores.
O iOS ainda aguarda GoogleService-Info.plist e registro Firebase reais; sua
compilação dependerá do ambiente Apple compatível. O ambiente Android local
continua sem SDK configurado. Não houve instalação de Android Studio/SDK,
build nativo ou build remoto. A Etapa 3.1 associou apenas o projeto autorizado e
publicou somente firestore:rules; não criou usuários ou documentos cloud.

### Fronteira de persistência

src/services/firebase/auth.ts e firestore.ts obtêm referências tipadas à
aplicação padrão nativa somente quando suas funções são chamadas. firestore.ts
expõe primitivas modulares para documentos, queries, transações, batches e
listeners, sem executar CRUD. collections.ts define apenas as cinco coleções
aprovadas. converters/datas.ts converte Timestamp ↔ Date; entidades ainda sem
uso real não receberam converters genéricos. Timestamp permanece nessa camada.

Na Etapa 3, essa infraestrutura não estava conectada às telas ou aos storages.
Naquela etapa, AsyncStorage era o único fluxo funcional de setores/produtos;
não havia gravação dupla. Setores foram migrados na Etapa 5. A inicialização
web existente continua útil para validar UI, mas não valida Firebase nativo.
Não foi configurado fallback Firebase web. A Etapa 4 conecta sessão/autenticação
à raiz nativa e fornece apenas um aviso de indisponibilidade na web.

### Offline e transações futuras

No Android, Firestore nativo utiliza persistência local por padrão. Leituras
podem refletir o cache disponível; escritas compatíveis podem permanecer locais
e sincronizar quando a conexão retornar. Isso não garante que todas as operações
de estoque funcionarão offline nem que uma escrita local foi aceita pelo servidor.

Operações capazes de violar estoqueAtual >= 0, especialmente saída, edição de
quantidade de movimentação e exclusão de entrada, não serão consideradas
definitivamente confirmadas offline. Transações Firestore exigem conexão e serão
usadas nas operações críticas futuras para manter movimentação e projeção de
estoqueAtual coerentes. Movimentações continuam como fonte lógica de verdade;
estoqueAtual será somente projeção derivada e reconstruível. Essa política e
suas garantias nas Rules serão implementadas na etapa de movimentações.

### Rules e emuladores locais

Na Etapa 3, firestore.rules negava todas as leituras/escritas de clientes, autenticados ou não,
incluindo subcoleções. É uma base restritiva, sem autorização funcional. As regras
por estabelecimento serão implementadas após usuário → estabelecimento e deverão
ser testadas antes de disponibilizar o aplicativo. Na Etapa 3.1, essa base local
foi publicada no projeto autorizado e conferida remotamente; acessos
administrativos por IAM não passam por essas Rules.

firebase.json configura somente Rules, Authentication Emulator (9099) e Firestore
Emulator (8080), em loopback. Para uso exclusivamente local, com Java compatível:

```powershell
npx --yes firebase-tools emulators:start --project demo-estoque-local --only auth,firestore
```

demo-estoque-local é um identificador exclusivamente de emulação, não um projeto
cloud escolhido para o produto. Apesar do alias cloud em .firebaserc, os testes
usam --project demo-estoque-local explicitamente. A conexão dos SDKs nativos aos
emuladores ainda não foi ativada no aplicativo. Em uma futura development build
Android, o host deverá ser configurado conforme o dispositivo (por exemplo,
10.0.2.2 no emulador Android); não basta usar o loopback do computador.

O teste de regressão das Rules usa somente endpoints de emulação e pode ser
executado com:

```powershell
npx --yes firebase-tools emulators:exec --project demo-estoque-local --only auth,firestore "node --test tests/firebase-rules.test.cjs"
```

Validação da Etapa 3: TypeScript sem erros, 18/18 verificações do Expo Doctor,
dependências aprovadas por expo install --check, sete testes existentes de
storage aprovados e exportação web gerada fora do repositório. As Rules compilaram
no Firestore Emulator 1.22.0 e 60 requisições foram negadas: leitura individual,
listagem, criação, edição e exclusão, anônimas e autenticadas, nas cinco coleções
e em uma subcoleção. Auditoria estática pela Skill firebase-security-rules-auditor:
sem achados para este escopo deny-all; não certifica regras funcionais futuras.
Os emuladores foram encerrados após o teste. Não foi validado build nativo,
persistência offline no aparelho ou conexão do aplicativo aos emuladores.

Na Etapa 3.1, npm ls --depth=0, TypeScript, Expo Doctor (18/18), Expo config,
os sete testes de storage e a suíte de Rules (60 acessos negados) passaram
novamente. A configuração Expo resolvida contém package e googleServicesFile
corretos. A auditoria deny-by-default não encontrou permissões abertas nem
bypass no escopo atual. O deploy somente de firestore:rules compilou e publicou
com sucesso. As configurações iOS foram preservadas, sem novo registro,
bundleIdentifier ou plist. Nenhum fluxo Login/Cadastro/estabelecimento foi criado.

npm audit reportou 55 vulnerabilidades na árvore instalada (1 baixa, 14
moderadas, 38 altas e 2 críticas, em shell-quote e tar). Nenhum npm audit fix ou
troca automática de SDK foi aplicado. A revisão de atualizações compatíveis fica
pendente. O npm também informou bloqueio de scripts postinstall transitivos de
@firebase/util e protobufjs; a política de execução não foi alterada.

Fontes oficiais consultadas nesta etapa:
- https://rnfirebase.io/ (Expo, Config Plugins e configuração nativa)
- https://rnfirebase.io/migrating-to-v26 (New Architecture e API modular)
- https://rnfirebase.io/firestore/usage (persistência e transações)
- https://docs.expo.dev/guides/using-firebase/ (development builds)

## Autenticação e onboarding — Etapa 4

RF-01/RF-02 e os critérios de segurança/sessão são atendidos pela camada nativa
React Native Firebase, API modular, com React Context simples e sem dependências
adicionais. A validação desses fluxos em dispositivo real permanece pendente.

### Sessão e navegação

Existe somente um NavigationContainer, na raiz, envolvendo RootNavigator.
SessionProvider observa onAuthStateChanged e representa a sessão por uma união
de estados: loading, unauthenticated, authenticatedWithoutProfile,
authenticatedReady e error. Cada mudança de conta invalida consultas anteriores;
respostas obsoletas não podem restaurar uma sessão encerrada. Listeners são
cancelados quando o provider desmonta.

Sem Auth, AuthNavigator oferece Login/Cadastro. Com Auth e sem usuarios/{uid},
o usuário segue para CriarEstabelecimentoScreen. Com perfil e estabelecimento
válidos confirmados pelo servidor, segue para StockNavigator. Falhas de consulta
ou documentos inválidos bloqueiam acesso e oferecem tentar novamente/sair.
Os dados do perfil não são tratados como confirmados a partir de cache ou de
escritas locais pendentes; portanto, a retomada dessa etapa exige conexão.
O carregamento ainda não foi validado em dispositivo sob perda de rede.

Login aceita e-mail/senha, valida campos e traduz erros. Cadastro exige e-mail,
senha e confirmação, mínimo local de seis caracteres e validatePassword do SDK
para a política real do Firebase antes da criação. Botões e campos impedem
envios simultâneos. Há KeyboardAvoidingView e uma única ScrollView nos formulários.
Textos são pt-BR e ações têm área mínima de 48 pixels. Login/Cadastro foram
conferidos na web em 360 × 740; teclado nativo ainda requer teste no aparelho.

### Duas fases e recuperação parcial

Auth cria a conta primeiro e mantém a sessão. O estabelecimento não é criado
na tela de cadastro. Na segunda fase, o serviço gera um ID de documento, aplica
trim ao nome (obrigatório, até 120 caracteres) e confirma que ainda não há perfil.
Um único writeBatch grava:

- estabelecimentos/{id}: id, nome, criadoEm (serverTimestamp), criadoPor (UID).
- usuarios/{uid}: id (UID), email da conta Auth, estabelecimentoId.

O batch resolve somente após confirmação da gravação. Em seguida o provider
consulta o servidor para liberar o estoque. Timestamp é convertido para Date
na camada de persistência; o domínio/telas não usam tipos Timestamp.

Auth e Firestore não compartilham uma transação. Se a conta existir e o onboarding
falhar ou for abandonado, a conta Auth não é apagada: a sessão sem perfil permite
retomar essa tela após reiniciar ou entrar novamente. Uma tentativa posterior
consulta o perfil no servidor antes de escrever; se a gravação anterior já tiver
sido confirmada, recupera o vínculo existente. Rules impedem onboarding duplicado
mesmo entre dispositivos. Nenhum processo de reparo cria estabelecimento solto.

Logout usa signOut e aparece como Sair no header autenticado, inclusive durante
onboarding. A navegação é reconstruída pelo estado da sessão, eliminando o fluxo
anterior do histórico. Falhas de logout ficam visíveis na tela de erro da sessão.

### Política de isolamento das Rules

Somente get do próprio usuarios/{uid} é permitido, incluindo a consulta de
perfil ausente necessária à recuperação. List/update/delete de usuários e
estabelecimentos são negados. Criação exige UID/e-mail do token, schemas estritos,
tipos e limites de tamanho. getAfter verifica que o batch cria ambos os documentos
novos com vínculo correspondente; exists impede associação a estabelecimento
preexistente e criação de um segundo estabelecimento por usuário com perfil.
criadoEm deve ser igual a request.time.

O estabelecimento só pode ser lido pelo usuário vinculado e criador nesta fase.
Convites/múltiplos membros não estão implementados. Na Etapa 4, setores, produtos,
movimentações, caminhos inesperados e subcoleções ficaram bloqueados.
Auditoria firebase-security-rules-auditor sem achados no escopo atual, com 132
subtestes de emulador aprovados (133 resultados incluindo o contêiner): dois
onboardings válidos, isolamento nos dois sentidos, operações não autenticadas,
campos inválidos, associação alheia, documentos isolados, replays e coleções
futuras. As Rules foram compiladas/publicadas somente em controle-de-estoque---tcc
e a política publicada foi confirmada via MCP. Nenhum usuário/documento cloud de
teste foi criado. Testes usam demo-estoque-local e portas temporárias quando as
portas padrão estão ocupadas, preservando firebase.json.

### Limitações transitórias e validação

Na Etapa 4, setores/produtos locais eram legado transitório. Após autenticar, as telas
existentes usavam AsyncStorage compartilhado no dispositivo. Esse
storage NÃO oferece isolamento seguro entre contas/estabelecimentos. A proteção
de Auth na navegação não muda essa limitação. A Etapa 5 migra somente setores.
Nenhuma nova funcionalidade depende desse storage, nem há sincronização dupla.

session.web.ts mantém o bundle web sem importar Firebase nativo: exibe claramente
a indisponibilidade e bloqueia acesso ao StockNavigator. Não existe Firebase JS
SDK instalado diretamente, configuração Web paralela ou sessão fictícia.

ios.bundleIdentifier está reservado; ios.googleServicesFile não existe, nenhum
app iOS foi registrado e não há GoogleService-Info.plist. Expo Doctor aprovou
18/18, TypeScript/Expo config/git diff --check passaram e 21 testes de lógica e
storage passaram. O bundle web foi gerado. Nenhum build Android foi executado:
Authentication, recuperação parcial, troca de conta/logout e teclado devem ser
validados numa development build antes de considerar funcionamento nativo
confirmado. A ausência do SDK local não é falha de implementação.

## Setores no Firestore — Etapa 5

Setores usam exclusivamente setores/{id}, com id igual ao documento e
estabelecimentoId obtido da sessão autenticada. O serviço usa React Native
Firebase modular; não há dependências novas, Firebase Web SDK, espelhamento em
AsyncStorage, polling ou sincronização manual. A query onSnapshot filtra
estabelecimentoId e ordena os nomes no cliente, sem índice composto.

O contrato Setor usa Date. O converter valida o documento e transforma Timestamp
na fronteira de persistência. Escritas usam serverTimestamp; estimativas locais
são admitidas somente para timestamps explicitamente pendentes e nunca são
gravadas como datas definitivas. Nome é normalizado com trim (1–120 caracteres);
descrição é opcional, normalizada, até 2000 caracteres e omitida quando vazia.
Atualizações preservam id, estabelecimentoId e criadoEm.

Lista e formulário apresentam carregamento, vazio, erro e tentativa novamente,
e impedem envios simultâneos. O sucesso de criação/edição aguarda a confirmação
da Promise do servidor. A lista acompanha o listener, incluindo mudanças locais
pendentes do SDK. O listener é cancelado ao desmontar; callbacks antigos são
descartados. A navegação é reconstruída quando UID ou estabelecimento mudam,
e a lista não renderiza dados de um contexto anterior.

A exclusão usa confirmação e verifica primeiro listarProdutosPorSetor no storage
local. Produtos existentes bloqueiam a operação com motivo claro; falha na leitura
também bloqueia. Esta proteção RN-08 não é uma garantia entre dispositivos ou
contra chamadas diretas ao SDK: Rules não consultam genericamente a ausência de
produtos locais. Produtos continuam no legado compartilhado do dispositivo e
serão migrados em etapa própria. Nenhum CRUD Firestore de produtos foi criado.

setoresStorage.ts e SetorLocal foram removidos após eliminar seus consumidores.
Dados antigos persistidos de setores não foram apagados, importados nem migrados
automaticamente. O Firestore pode começar vazio mesmo que existam dados locais
antigos. ProdutoLocal e produtosStorage.ts foram preservados.

### Segurança e validação

Rules permitem CRUD somente no estabelecimento do perfil usuarios/{uid}.
Anônimos e usuários sem perfil não acessam setores. Schemas são estritos,
timestamps de escrita devem corresponder a request.time e atualizações permitem
somente nome, descricao e atualizadoEm. Campos de identidade e criadoEm são
imutáveis. Queries sem filtro ou de outro estabelecimento são negadas. Onboarding
da Etapa 4 foi preservado; produtos, movimentações e subcoleções ficam fechados.

Auditoria pela Skill firebase-security-rules-auditor: sem achados no escopo atual,
com a limitação RN-08 explicitada. Firestore/Auth Emulator aprovaram 223 subtestes
(224 resultados incluindo o contêiner), usando demo-estoque-local e portas livres
no arquivo temporário externo; firebase.json do projeto foi preservado. Os
emuladores iniciados pelo teste foram encerrados ao final. Os 27 testes de lógica,
conversão e storage passaram; TypeScript, Expo Doctor (18/18), Expo config,
exportação web e git diff --check também passaram.

### Cache, offline e validação nativa pendente

O cache e a fila de escrita são os nativos do Firestore. Sem rede, a interface
informa que uma gravação aguarda confirmação; não comunica sucesso definitivo
antes do servidor. Não foi criado cache manual. A sessão já pronta pode consumir
o cache permitido pela query, mas a retomada fria do app ainda exige confirmação
do perfil/estabelecimento no servidor, conforme a decisão da Etapa 4.

A camada .web mantém a compilação e informa a indisponibilidade do backend nativo;
a sessão web continua bloqueando o acesso ao estoque. Não foi usado backend Web
paralelo nem sessão fictícia para validar setores. Build Android, CRUD real,
cache/offline, reconexão, troca A → logout → B e layout/teclado em 360 × 740 ainda
precisam de validação numa development build. Os testes de Rules comprovam
isolamento no backend, mas não substituem essas verificações no aparelho.

O deploy exclusivo de firestore:rules foi concluído em controle-de-estoque---tcc.
A leitura da política publicada confirmou setores e validações ativas, mantendo
produtos/movimentações fechados. Nenhum usuário ou documento cloud de teste foi criado.


## Produtos definitivos e estoque inicial — Etapa 6

RF-07/RF-08/RF-10/RF-11, RN-01/RN-02/RN-03/RN-06/RN-07/RN-08/RN-12/RN-14
são atendidos pelos serviços de produtos nativos. Não houve instalação de
bibliotecas ou implementação de telas gerais de entrada/saída.

Produto contém id, estabelecimentoId, setorId, nome, descricao opcional,
quantidadeInicial, estoqueMinimo opcional, estoqueAtual, criadoEm e atualizadoEm.
Quantidades são inteiros seguros entre 0 e 9007199254740991 (precisão do JavaScript).
O saldo é projeção derivada do histórico, não editável: nesta etapa somente a
entrada inicial é permitida, logo estoqueAtual == quantidadeInicial. Esse vínculo
é conferido nas Rules e no converter. Ao liberar movimentos gerais, converter,
serviços e Rules deverão manter a projeção pela soma de entradas menos saídas.

### Cadastro e listener

Um writeBatch grava produto e, somente se inicial > 0, a entrada em
movimentacoes/inicial_{produtoId}, com quantidade igual à inicial, observacao
'Estoque inicial', criadoPor da sessão e criadoEm igual ao produto (serverTimestamp).
O schema do movimento segue o pedido da Etapa 6: sem motivo e sem id no documento;
o ID está no caminho. Rules usam getAfter para exigir o par e rejeitar projeção
forjada, movimento inválido/duplicado ou criação parcial. Inicial zero exige
saldo zero e ausência de movimento.

onSnapshot consulta estabelecimentoId da sessão e setorId atual; ordenação é
local por nome. O hook cancela listeners e invalida resultados ao mudar conta,
estabelecimento ou setor. Cache nativo não substitui o servidor. Cadastro pode
ficar pendente offline; sucesso depende da confirmação do batch. Edição grava
apenas nome, descrição e mínimo; Rules preservam ID, vínculos, inicial, saldo e
data de criação. Zero e necessidade de reposição são indicados por texto; mínimo
opcional usa estoqueAtual <= estoqueMinimo.

### RN-08 e concorrência

Antes de excluir setor, a aplicação consulta Produtos no servidor, filtrando
estabelecimentoId + setorId e limitando a um documento. Falha de rede não é
tratada como setor vazio. Para fechar a corrida com cadastros concorrentes e
proteger exclusão direta pelas Rules, setor possui campos técnicos
quantidadeProdutos e ultimaOperacaoProdutoId. Não são editáveis na interface.
Criação de produto incrementa contador e aponta para o produto no mesmo batch;
exclusão decrementa na mesma transação. Rules verificam o produto antes/depois,
o vínculo e a diferença exata de uma unidade. Edição normal do setor preserva
ambos. Setor antigo sem contador equivale a zero, pois Produtos nunca haviam
sido liberados no Firestore. Não há migração de produtos locais.

Exclusão do setor lê contador em transação e Rules exigem zero. Cadastro
concorrente muda o documento lido, provocando revalidação; se ocorrer depois da
exclusão, não pode criar produto sem setor. Apenas um produto por setor pode
ser criado/excluído por commit neste protocolo. Isso não limita o total de
produtos, mas gera disputa no documento do setor sob grande concorrência.

### RN-07 e limite real de cascade

Nesta etapa, cada produto possui zero ou exatamente uma movimentação inicial,
com ID determinístico e imutável; movimentos normais continuam negados. Exclusão
consulta o histórico no servidor (limit 2) e falha sem apagar nada se houver
qualquer movimento fora desse contrato. Depois lê produto, setor e entrada
inicial positiva em transação, remove produto + movimento e decrementa contador.
No máximo três documentos são escritos. Rules rejeitam exclusão do produto
que deixe a entrada inicial e exclusão isolada dessa entrada. Produto com
inicial zero não consulta um documento inicial ausente, cuja leitura não é
permitida pelas Rules; a consulta filtrada confirma histórico vazio.

Não há deleção em lotes parciais ou risco de exceder o limite de batch para o
histórico permitido nesta etapa. Se movimentos gerais forem liberados, esta
estratégia NÃO atende cascade de histórico arbitrário: deve ser revisada antes,
com operação de servidor apropriada para volume e concorrência. Importações
administrativas/IAM ignoram Rules; documentos inconsistentes bloqueiam a
exclusão e exigem análise, nunca reparo destrutivo automático.

### Validação e publicação

Rules Emulator: 295 resultados aprovados (293 subtestes + 2 contêineres), incluindo
70 novos subtestes desta etapa. O contador técnico aceita também números decimais integrais seguros, pois o incremento do SDK Android usa double; quantidades de domínio continuam int nas Rules. Auditoria com firebase-security-rules-auditor:
score 5, sem achados no escopo testado. Somente firestore:rules foi publicado
no projeto controle-de-estoque---tcc após os testes. O banco existente (default)
foi conferido novamente: STANDARD, FIRESTORE_NATIVE, southamerica-east1.

Testes de lógica/serviços: 30 aprovados, incluindo Auth e Setores existentes e
10 casos de Produtos. Testes obsoletos do storage local foram substituídos por
cobertura de batch, listener, RN-08 Firestore e cascade. Nenhum commit realizado.

Referência oficial de atomicidade/transações e limites de acesso das Rules:
https://firebase.google.com/docs/firestore/manage-data/transactions

Validação Android da Etapa 6 no development build existente, em 360 x 740 dp:
produto inicial 10 apresentou estoque 10; edição de nome/mínimo 10 apresentou
reposição; fração 1.5 foi rejeitada; alteração externa de nome atualizou o
listener sem recarregar. RN-08 bloqueou setor ocupado. Cancelar confirmação
preservou produto; confirmar excluiu produto e entrada, com consulta servidor
confirmando ausência de órfãos; depois setor pôde ser excluído. Produto inicial
zero não criou movimento e também foi removido pelo fluxo definitivo.

Logout/login e trocas A -> B -> A -> B exibiram somente os dados de cada
estabelecimento. Consultas cruzadas às três coleções foram negadas nas Rules
publicadas. Duas contas e todos os documentos de teste foram removidos após a
validação e a remoção foi conferida independentemente. Credenciais temporárias
ficaram fora do repositório e foram apagadas. Configuração de tamanho/densidade
do emulador foi restaurada; aplicativo ficou deslogado.

TypeScript, 30 testes de lógica/serviços, Expo Doctor (18/18) e git diff --check
passaram. Não houve migração automática, novas dependências ou commit. A única
incompatibilidade encontrada no Android foi o incremento double do contador,
corrigida nas Rules e coberta por novos testes antes da republicação.

## Etapa 7A — Movimentações, projeção e histórico

### Transações de entrada e saída

`movimentacoesService` usa `runTransaction`: lê o produto dentro do callback,
confere estabelecimento/setor e quantidade inteira positiva segura, calcula o
novo saldo e grava movimentação + projeção atomicamente. Cada reavaliação lê o
saldo atual novamente. Uma saída maior que esse saldo falha com `Estoque
insuficiente.` sem gravações. ID, vínculos, quantidade inicial e criação são
preservados. O ID da nova movimentação é gerado uma vez por tentativa, fora do
callback, para permanecer estável nas reavaliações.

### Política online

Entrada e saída exigem confirmação da transaction pelo servidor. Sem conexão,
a interface informa que é necessária conexão e não apresenta sucesso. Não há
fila manual, movimentação temporária ou armazenamento do estoque no AsyncStorage.
O histórico já sincronizado permanece acessível no cache nativo Firestore.

### Estoque atual como projeção

`estoqueAtual` representa soma de entradas menos soma de saídas; não é editável
pela interface e não substitui o histórico. A comparação com `estoqueMinimo`
deriva o indicador de reposição, sem outro campo persistido. As Rules vinculam
bilateralmente cada movimento novo à alteração exata do saldo usando `get` e
`getAfter`, exigindo autor autenticado e preservando os campos imutáveis.

Campos técnicos internos `quantidadeMovimentacoes`, `movimentacaoIds` e
`ultimaMovimentacaoId` registram, respectivamente, a contagem total, os primeiros
seis IDs e o último ID confirmado. Cada transaction incrementa a contagem,
acrescenta o ID enquanto há menos de seis e aponta para o novo movimento.
Depois desse limite, a lista fica fixa, mas contagem e ponteiro continuam
avançando: registrar movimentos não é limitado a seis. As Rules protegem a
transição exata e rejeitam registros técnicos parciais ou alteração pela edição
normal de produto. Esses campos não são uma segunda fonte de saldo.

Produtos legados da Etapa 6 sem os três campos derivam registro vazio quando
inicial zero, ou `[inicial_{produtoId}]` quando inicial positiva. Não há migração
automática. A movimentação inicial antiga sem `id` continua válida pelo caminho
determinístico; novos documentos incluem `id`.

### Histórico em tempo real

O listener consulta `movimentacoes` por estabelecimento da sessão + produto,
nunca globalmente. O converter entrega `Date` à UI e a ordenação decrescente
ocorre no cliente, dispensando índice composto de ordenação. O hook limpa o
listener ao perder foco, sair da tela ou mudar sessão e invalida callbacks
antigos. ProdutoDetalhes usa uma única FlatList vertical, incluindo o cabeçalho,
para manter todo o histórico acessível em telas pequenas. Nesta etapa não há
edição nem exclusão individual de movimentos.

### Exclusão atual de produto

A exclusão consulta TODOS os movimentos do mesmo estabelecimento/produto no
servidor, sem limite de consulta. Compara os IDs com o registro protegido e
remove todo o histórico, produto e decrementa o contador do setor em uma única
transaction, sem lotes parciais. Ela lê produto e setor antes das escritas:
uma nova movimentação concorrente altera o produto e provoca reavaliação; se
o histórico consultado ficar desatualizado, a exclusão é cancelada integralmente.
As Rules exigem ausência de todos os movimentos registrados após o commit;
delete de movimento só é permitido nessa operação de cascade. RN-08 permanece
baseada nos produtos Firestore e no contador protegido do setor.

### Limite técnico do cascade no cliente

O limite adotado e testado é **seis movimentações por produto**, incluindo a
inicial. São até oito escritas: seis movimentos + produto + setor. O limite
decorre do orçamento de acessos a documentos e expressões das Security Rules
para validar a exclusão completa; o limite nominal de escritas de um batch não
garante que essa validação caiba. Acima de seis, aplicação e Rules bloqueiam a
exclusão sem remover nenhum dado, mas permitem novas entradas e saídas.

Para histórico maior, a solução futura exige backend confiável que coordene
concorrência e exclusão; não há Cloud Functions nesta etapa. Dados importados
por administração/IAM fora do protocolo exigem análise de consistência: o
cliente não faz reparo destrutivo automático.

Referências oficiais:
https://firebase.google.com/docs/firestore/manage-data/transactions
https://firebase.google.com/docs/firestore/security/rules-conditions


## Etapa 7B — Correções e exclusões individuais

Esta seção atualiza o protocolo da 7A. RF-15/RF-16; RN-02/03/04/05/07/09/11/12/14;
RNF-02/04/05/06/07/08/09/10/11 são os critérios afetados. Não há relatórios nesta etapa.

### Delta e transações

Entrada: novo saldo = saldo + nova quantidade - quantidade antiga.
Saída: novo saldo = saldo + quantidade antiga - nova quantidade.
Excluir entrada subtrai sua quantidade; excluir saída devolve sua quantidade.
Toda quantidade é inteira, finita, positiva e segura; saldo final é inteiro seguro >=0.

editarMovimentacao/excluirMovimentacao leem primeiro movimento, depois produto,
no callback de runTransaction, verificam sessão e vínculos e confirmam ambas as
escritas atomicamente no servidor. Reavaliação relê quantidade antiga e saldo;
nenhum desses valores recebidos da tela é usado como verdade. Tipo, IDs, vínculos,
autor e criadoEm são imutáveis. Só quantidade, observacao e atualizadoEm podem mudar.
Observação vazia remove o campo opcional. Quantidade igual gera apenas escrita na
movimentação, sem alterar produto ou seu atualizadoEm.

Movimentação inicial segue as mesmas operações. Produto.quantidadeInicial é a
quantidade ORIGINALMENTE informada no cadastro; uma correção da movimentação
inicial NÃO a modifica. Histórico e sua projeção continuam sendo a fonte do saldo.

### Protocolo de Rules

Não se adicionaram campos técnicos. ultimaMovimentacaoId agora identifica a
última operação de saldo (create/update/delete); após delete pode apontar para
um documento ausente. Observação somente não modifica esse ponteiro.
quantidadeMovimentacoes conta movimentos EXISTENTES. movimentacaoIds guarda até
seis IDs existentes; create acrescenta enquanto houver espaço; delete remove seu
ID quando registrado; edição não altera lista/contagem. Não se preenche a lista
por consulta nem se cria outra cópia do saldo. Históricos antigos >6 continuam
com lista parcial; excluir IDs registrados pode deixá-la parcial mesmo abaixo de 6.
Nesse caso cascade continua bloqueado até contagem e lista comprovarem o conjunto
completo. Isso evita migrações e preenchimentos não verificáveis pelas Rules.

Produto valida estado anterior/final do documento apontado: create exige ausência
anterior e append/count+1; update exige quantidade diferente e delta exato; delete
exige ausência final e remoção/count-1. Movimentação exige reciprocamente esse
mesmo ponteiro/operação; um segundo movimento não pode reutilizar o delta.
Observação somente exige saldo idêntico e produto existente, sem escrita artificial.
Schema estrito/diff protegem todos os campos imutáveis, inclusive id legado ausente.
O acesso continua isolado pelo perfil autenticado e estabelecimento.

### UI, confirmação e offline

Histórico mantém uma única FlatList vertical com cabeçalho, tipo, sinal, data,
observação e botões Editar/Excluir. Formulário reutilizado preenche dados atuais e
mostra tipo como texto. Refs de envio e botões bloqueados evitam múltiplos envios.
Modal mostra impacto, Cancelar não chama serviço, Excluir aguarda servidor.
Listeners existentes atualizam histórico, produto, lista e reposição, sem saldo
local otimista ou reinicialização. Sem servidor, transaction falha e mensagem é
“É necessária conexão para alterar movimentações.” Cache sincronizado continua
acessível; não há fila manual. Web preserva a limitação nativa já documentada na 7A.

### Cascade: limite conservador mantido em seis

Não se implementa cascade parcial. Cliente consulta TODO o histórico no servidor,
valida contagem/conjunto e transaction remove movimentos+produto+contador do setor.
Rules exigem ausência final de CADA ID do registro completo; só verificar que o
produto sumiu permitiria deixá-lo órfão omitindo deletes, portanto foi descartado.

A prova de exclusão exige N getAfter de movimentos, além do perfil e das verificações
de setor antes/depois. Firestore limita a10 acessos por operação e20 no commit;
cache pode reduzir chamadas repetidas, mas não elimina os N caminhos distintos.
Dez movimentos já gastariam todo o orçamento só no histórico, sem autorização e
setor. Manter seis conserva a margem do protocolo já aprovado em produção.
O limite de writes do batch não resolve esse limite de Rules.

Testes com10/20/50 confirmam que o protocolo publicado bloqueia o cascade completo
e preserva TODOS os documentos. Um experimento isolado em arquivo temporário com
registro e prova estendidos a10 foi ACEITO pelo Emulator. Não foi publicado:
Emulator não reproduz todos os limites de produção. Esse resultado NÃO prova que
a operação cabe no orçamento real. Não se alega que seis é o máximo matemático
absoluto; é o limite conservador validado. Cascade maior exige backend confiável
com coordenação de concorrência e atomicidade; nenhum backend foi adicionado.

Fontes: https://firebase.google.com/docs/firestore/security/rules-conditions
https://firebase.google.com/docs/emulator-suite/connect_firestore#how_the_cloud_firestore_emulator_differs_from_production

### Auditoria de Security Rules (firebase-security-rules-auditor)

Auditoria aplicada após implementação/testes: autenticação e autoridade do perfil
não editável; isolamento; bootstrap próprio atômico; diff/hasOnly em updates;
tipos, limites de textos/inteiros; timestamps; replay do ponteiro; alterações
unilaterais; dois deletes com um delta; cascade incompleto; inicial e observação.
Ataques correspondentes foram rejeitados no Emulator. Nenhum bypass crítico
identificado na revisão e nos cenários executados; isso não é prova exaustiva.

```json
{"score": 5,"summary": "Isolamento e protocolo bilateral de saldo validados em 417 cenários do Emulator; revisão não identificou bypass nos caminhos avaliados.","findings": []}
```

Verificação: TypeScript, 46 testes de lógica/serviços, Expo Doctor 18/18,
417 testes de Rules, validador Firebase sem erros. Validação Android e deploy
são registrados abaixo após conclusão. Nenhuma dependência adicionada ou commit.


### Resultado final da 7B

Deploy exclusivo de firestore:rules concluído em controle-de-estoque---tcc.
Android development build validado em 360×740: fluxo de deltas, exclusões, inicial
negativa, observação, cancelamento, offline, reposição, lista e logout/login.
Dados e conta de teste removidos e conferidos. Relatório completo e evidência visual
em [VALIDACAO_ETAPA_7B.md](VALIDACAO_ETAPA_7B.md). Nenhum commit.

## Etapa 8 — Relatórios

### Fontes, consultas e ciclo de vida

Relatórios são somente leitura. Usam as coleções top-level aprovadas `produtos`,
`setores` e `movimentacoes`, sem alterar o protocolo de escrita das etapas 6–7B.
O estado atual de estoque usa a projeção `estoqueAtual` mantida atomicamente pelo
histórico no protocolo aprovado; nenhuma segunda fonte ou campo derivado é criado.

`relatoriosService` abre três listeners, todos com `estabelecimentoId ==` o perfil
da sessão autenticada. Produtos e setores são carregados por estabelecimento.
Movimentos são limitados também por `criadoEm >= inicio`, `criadoEm < fimExclusivo`
e ordenados por `criadoEm desc`. Setor, produto e tipo são filtros locais do conjunto
já autorizado no servidor. Isso evita um índice para cada combinação de filtros.
Não se busca a coleção inteira para posteriormente filtrar o estabelecimento.

`useRelatorios` mantém assinaturas apenas enquanto a rota está focada. Blur,
mudança de período, retry e mudança de sessão encerram os listeners. Erro de
qualquer consulta encerra os três e é mostrado com retry, sem virar lista vazia.
Uma chave de UID/estabelecimento/período bloqueia dados antigos no próprio render,
antes do cleanup. Callbacks tardios são ignorados e a sessão é validada novamente.
Os três primeiros snapshots são necessários antes de publicar um resultado.

### Agregação e métricas

`utils/relatorios.ts` concentra a agregação pura; formatação e intervalo de datas
ficam em utilitários separados. Mapas de produto/setor resolvem nomes sem leituras
por linha. Totais e rankings somam as quantidades de todas as movimentações válidas
do período/filtros, em vez de escolher a maior movimentação individual.

- Entradas: soma de entradas; saídas: soma de saídas, sempre positiva.
- Saldo do período: entradas − saídas, podendo ser negativo. Não é estoque atual.
- Movimentações: número de registros; produtos movimentados: IDs distintos.
- Rankings: quantidade decrescente, nome pt-BR e ID para desempate determinístico.
- Totais por setor: entradas/saídas dentro de todos os filtros.
- Sem movimentação: produtos elegíveis sem entrada **nem** saída no período.
  Respeita setor/produto, independe do tipo, conforme RF-21.
- Reposição: mínimo definido e estoque atual <= mínimo; zero: estoque atual == 0.
  Ambos respeitam setor/produto e independem de período/tipo, conforme texto na UI.

Datas DD/MM/AAAA são validadas por calendário, sem comparação textual. Intervalo
usa o fuso local do dispositivo: início do primeiro dia até início do dia seguinte
ao último, exclusivo. Construção pelo calendário respeita DST e inclui timestamps
do último dia com precisão superior a milissegundos. Período padrão: mês até hoje.
Quantidades seguem o contrato de inteiros seguros existente; overflow de soma
gera erro explícito pedindo redução do período, sem exibir métricas imprecisas.

São três consultas fixas, sem N+1. Mapas e somas custam O(P+S+M); ordenações custam
O(P log P + M log M). A SectionList virtualiza resultados em uma única área vertical.
Esta versão carrega produtos/setores do estabelecimento e todo o período solicitado
em memória, sem paginação. Períodos extensos/históricos muito grandes aumentam
leituras e memória; evolução futura deve manter totais completos, sem truncar dados.
Listeners independentes podem apresentar transitoriamente produto/setor indisponível
durante atualizações; isso não dispara leitura por item nem autoriza outra sessão.

### Índice e deploy

Único índice composto necessário, escopo COLLECTION de `movimentacoes`:
`estabelecimentoId ASC`, `criadoEm DESC` (`__name__ DESC` implícito).
Declarado em `firestore.indexes.json`, referenciado por `firebase.json`.
Publicado apenas com `firebase deploy --only firestore:indexes --project
controle-de-estoque---tcc` e confirmado READY na base `(default)` do mesmo projeto.
ID: `CICAgOjXh4EK`. Rules não foram alteradas ou publicadas nesta etapa.

### Offline e interface

Snapshots incluem mudanças de metadata. Cache ou writes pendentes em qualquer
fonte exibem aviso de dados possivelmente desatualizados/incompletos, inclusive
em estados vazios. Não existe cache paralelo em AsyncStorage, localStorage ou
sessionStorage. O cache persistente pertence ao SDK nativo; a leitura sempre
exige sessão e estabelecimento atuais. Erro não é ausência de dados.

Rota tipada `Relatorios` no StockNavigator, acessível pela tela Setores, com header
e logout preservados. Filtros ficam no cabeçalho da SectionList. Seletores pesquisáveis
usam modal e lista separados da rolagem principal. Detalhes abrem a rota existente,
com produto/setor conferidos contra a sessão. Não foram adicionadas dependências,
gráficos, exportações, módulos comerciais ou alterações de cascade.
Web preserva o aviso de Firebase nativo indisponível já aprovado, sem migração incidental.

Validação e evidências da etapa: [VALIDACAO_ETAPA_8.md](VALIDACAO_ETAPA_8.md).
