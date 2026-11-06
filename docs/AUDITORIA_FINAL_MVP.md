# Auditoria final do MVP — Etapa 9

As evidências complementares desta validação integram o acervo interno do projeto.

Data: 05/10/2026. Projeto `controle-de-estoque---tcc`; Firestore `(default)`,
STANDARD, `southamerica-east1`; Android `com.murilo.estoqueporsetores`.
Sem commit, atualização geral de dependências ou deploy nesta etapa.

## Resumo executivo

Auditoria do levantamento original v1.2, de 02/10/2026, das decisões aprovadas nas
etapas 1–8 e dos fluxos implementados. Fonte original:
levantamento de requisitos v1.2, mantido no acervo acadêmico do projeto.
As exceções explicitamente autorizadas nesta etapa são mantidas e classificadas,
sem apresentar o MVP como cumprimento irrestrito do documento original.

Foram corrigidos listeners de setores/produtos ativos fora de foco, o aviso de
parâmetros Date não serializáveis na navegação, mensagens de cascade com detalhes
técnicos e textos que sugeriam iOS pronto. Removidos três arquivos mortos e a
dependência direta AsyncStorage sem uso. Protocolo de estoque/Rules preservado.
Também corrigido feedback de exclusão no histórico longo: quando falha, a lista
volta ao topo para tornar o erro visível, sem depender de rolagem manual.

## Matriz requisito × implementação

52 IDs formais: 22 RF, 14 RN e 16 RNF. **48 ATENDIDOS, 4 ATENDIDOS COM LIMITAÇÃO,
0 NÃO ATENDIDOS, 0 NÃO APLICÁVEIS entre esses 52 IDs**. Itens futuros sem ID
do capítulo 10 são NÃO APLICÁVEIS AO MVP e não aumentam artificialmente esse total.

Legenda de arquivos/testes (caminhos relativos à raiz do projeto):

- A: `src/services/firebase/session.ts`, `src/session/`, `src/screens/auth/`,
  `src/navigation/RootNavigator.tsx`; `tests/auth.test.cjs`.
- S: `src/services/setores/`, `src/screens/setores/SetoresScreen.tsx`,
  `SetorFormScreen.tsx`; `tests/setores.test.cjs`, `tests/produtos.test.cjs` (RN08).
- P: `src/services/produtos/`, `src/screens/setores/ProdutosScreen.tsx`,
  `ProdutoFormScreen.tsx`, `ProdutoDetalhesScreen.tsx`; `tests/produtos.test.cjs`.
- M: `src/services/movimentacoes/`, `src/utils/movimentacoes.ts`,
  `src/screens/setores/MovimentacaoFormScreen.tsx`, `ProdutoDetalhesScreen.tsx`;
  `tests/produtos.test.cjs` (7A/7B).
- R: `src/services/relatorios/`, `src/utils/relatorios.ts`,
  `periodoRelatorio.ts`, `src/screens/relatorios/RelatoriosScreen.tsx`;
  `tests/relatorios.test.cjs`.
- F: `firestore.rules`; `tests/firebase-rules.test.cjs`, incluindo onboarding,
  isolamento, schema, deltas, concorrência e cascade.
- U: `src/components/AuthFormLayout.tsx`, `ConfirmModal.tsx`, `FiltroSelecao.tsx`,
  navegadores, hooks; `tests/listeners.test.cjs`, `tests/navigation.test.cjs`.
- E9: execução Android desta auditoria descrita abaixo; E7B/E8: execuções reais
  documentadas em [VALIDACAO_ETAPA_7B.md](VALIDACAO_ETAPA_7B.md) e
  [VALIDACAO_ETAPA_8.md](VALIDACAO_ETAPA_8.md), com capturas. Essas evidências
  complementam os cenários repetidos em E9; código sozinho não foi considerado prova.

| ID | Descrição | Status | Responsável | Teste | Android | Observação |
| --- | --- | --- | --- | --- | --- | --- |
| RF-01 | Autenticação, sessão e logout | ATENDIDO | A | A/F | E9 A/B, logout/login/restart | Perfil e estabelecimento confirmados no servidor |
| RF-02 | Isolar estabelecimento e compartilhar usuários autorizados | ATENDIDO COM LIMITAÇÃO | A/S/P/M/R/F | F isolamento; hooks troca de conta | E9 A/B; E8 retorno A | Isolamento atendido; sem convite/gestão de vários usuários; mesma conta em vários dispositivos |
| RF-03 | Cadastrar setor e persistir | ATENDIDO | S | S/F | E9 cadastro e restart | Nome obrigatório |
| RF-04 | Listar setores e estados vazios | ATENDIDO | S/U | S/F | E9 onboarding/lista | Lista isolada, ações de CRUD |
| RF-05 | Editar setor | ATENDIDO | S | S/F updates | E9 formulário e lista | Preserva identidade e não duplica |
| RF-06 | Excluir setor com confirmação | ATENDIDO | S/U | P RN08/F | E9 cancelar/bloqueio/excluir vazio | Setor ocupado bloqueado |
| RF-07 | Cadastrar produto e entrada inicial | ATENDIDO | P/M | P inicial 0/10/F | E9 inicial 10 | Marca Estoque inicial na observação, conforme RN06 e contrato aprovado |
| RF-08 | Listar produtos por setor | ATENDIDO | P | P listener/F queries | E9 lista A/B | Saldo é projeção do histórico |
| RF-09 | Detalhes e histórico completo | ATENDIDO | P/M/U | P histórico | E9 detalhes e rolagem; E7B | Uma FlatList principal, header preservado |
| RF-10 | Editar produto | ATENDIDO | P | P metadados/F | E9 mínimo/descrição; E7B | Inicial e vínculos imutáveis |
| RF-11 | Excluir produto sem órfãos | ATENDIDO COM LIMITAÇÃO | P/M/F/U | P cascade/F | E9 bloqueio histórico extenso; E7B cascade real | Até seis e prova completa dos IDs; nenhuma remoção parcial |
| RF-12 | Registrar entrada | ATENDIDO | M | P entrada/F delta | E9 +5 e >6 movimentos | Quantidade positiva; criadoPor da sessão |
| RF-13 | Registrar saída | ATENDIDO | M | P saída/negativo/F | E9 -4 e estoque insuficiente | Servidor valida o saldo |
| RF-14 | Histórico do produto e ordem | ATENDIDO | M/U | P ordenação/consulta/F | E9 até inicial; E7B/E8 | Tipo, quantidade, data, observação, editar/excluir |
| RF-15 | Editar movimentação | ATENDIDO | M | P 7B/F | E9 entrada 5→8 e saída 4→6 | Substitui contribuição antiga; tipo imutável |
| RF-16 | Excluir movimentação | ATENDIDO | M/U | P 7B/F | E9 cancelar, excluir entrada/saída | Atualiza saldo e histórico sem reiniciar |
| RF-17 | Relatórios completos por quantidade | ATENDIDO | R | R totais/setores/F query | E9 resumo após alterações; E8 27/13/14 | Não são valores financeiros |
| RF-18 | Filtros por datas, setor, produto e tipo | ATENDIDO | R/U | R intervalos/combinações | E9 filtros; E8 combinação/limpeza/período inválido | Não altera persistência; fim do dia inclusive |
| RF-19 | Maior saída e abrir detalhes | ATENDIDO | R | R ranking por soma | E9 abrir detalhes; E8 ranking | Ordem decrescente, filtros respeitados |
| RF-20 | Maior entrada e abrir detalhes | ATENDIDO | R | R ranking por soma | E9 ranking; E8 ranking | Soma das quantidades, não maior registro |
| RF-21 | Produtos sem movimentação no período | ATENDIDO | R | R sem movimento/período vazio | E8 período vazio; E9 filtro vazio | Ausência de ambos os tipos; não exclui produto |
| RF-22 | Zerados e reposição | ATENDIDO | P/R | P <= mínimo/R zerados | E9 mínimo 12; E8 reposição/zerado | Estoque atual independente de período/tipo |
| RN-01 | Produto exige setor | ATENDIDO | P/F | P/F vínculo | E9 cadastro dentro de setor | Rules impedem vínculo inexistente/cruzado |
| RN-02 | Movimento exige produto | ATENDIDO | M/F | P/F vínculo | E9 histórico do produto | Setor derivado do produto |
| RN-03 | Entradas menos saídas | ATENDIDO | M/P | P/F | E9 comparação após cada operação | Projeção transacional igual ao histórico |
| RN-04 | Nunca estoque negativo | ATENDIDO | M/F | P reavaliação/F concorrência | E9 rejeição; E7B edição inválida | Sem validação apenas local |
| RN-05 | Quantidade numérica positiva | ATENDIDO | M | P formulários/F vazio/zero/negativo | E9 zero e estoque insuficiente | Inteiros seguros; frações fora do contrato aprovado |
| RN-06 | Entrada inicial automática | ATENDIDO | P/M | P inicial/F mesma data | E9 entrada 10 | Não soma quantidadeInicial novamente |
| RN-07 | Produto excluído remove histórico | ATENDIDO COM LIMITAÇÃO | P/M/F | P/F cascade | E7B cascade; E9 limite | Produto permanece quando cascade não pode ser provado |
| RN-08 | Bloquear exclusão de setor ocupado | ATENDIDO | S/P/F | P RN08/F contador | E9 bloqueio | Mensagem explica produtos vinculados |
| RN-09 | Modal para toda exclusão | ATENDIDO | U/S/P/M | F/P exclusões | E9 confirmações e cancelamento | Confirma impacto sobre histórico/saldo |
| RN-10 | Histórico recente primeiro | ATENDIDO | M | P ordenar | E9 recente até inicial | Ordenação local determinística por data |
| RN-11 | Atualizar saldo/histórico/lista/relatório | ATENDIDO | P/M/R | P 7B/R listeners | E9 retorno lista/relatório; E8 tempo real | Foco renova listeners, não requer restart |
| RN-12 | Mínimo opcional e <= | ATENDIDO | P/R | P/R mínimo | E9 presente em 10/11/12, ausente em 14/15 | Zero também destacado |
| RN-13 | Firestore como verdade | ATENDIDO | A/S/P/M/R | P/R/F | E9 persistência online/offline | Sem storage paralelo; cache do SDK |
| RN-14 | Todas consultas isoladas | ATENDIDO | A/S/P/M/R/F | F queries/leituras/hooks | E9 A/B e retorno; E8 | Perfil por UID; estabelecimento conferido |
| RNF-01 | Interface simples | ATENDIDO | U/telas | Inspeção de UX | E9 fluxo Android | Português e ações visíveis |
| RNF-02 | Feedback de ações e erros | ATENDIDO | U/telas/utils | A/S/P traduções | E9 validações, offline, bloqueio | Não confirma estoque sem servidor |
| RNF-03 | Estados vazios claros | ATENDIDO | S/P/M/R/U | R vazio/listeners | E9 onboarding/listas; E8 relatório vazio | Erro não é tratado como coleção vazia |
| RNF-04 | Confirmação destrutiva | ATENDIDO | U | P/F | E9 cancelar/excluir | Modal compartilhado |
| RNF-05 | Funcionar em Android | ATENDIDO | app.json/telas | Build/Doctor/TS | E9 development build Pixel 6 API36 | Sem teste em dispositivo físico |
| RNF-06 | Layout pequeno/médio/grande | ATENDIDO | U/estilos | Inspeção visual | E9 360×740 e 411×891; E8 nome longo | Teclado e botões acessíveis |
| RNF-07 | Rolagem até todo histórico | ATENDIDO | P/R/U | Inspeção + dados | E9 >6 movimentos até inicial; E8 | Sem ScrollView vertical aninhada |
| RNF-08 | Preservar header | ATENDIDO | navegadores | Inspeção | E9 headers e voltar/logout | Datas removidas dos params, não header |
| RNF-09 | Nuvem/sync e preservar escrita offline | ATENDIDO COM LIMITAÇÃO | A/M/P/R | P offline/F | E9 sessão quente/fria offline; E7B/E8 | Escritas críticas de estoque exigem online; não há fila. Cold start aguarda servidor |
| RNF-10 | Integridade dos dados | ATENDIDO | F/P/M | 446 F + P | E9 matemática e bloqueios | Atomicidade, schema, vínculos e saldo |
| RNF-11 | Auth e Rules contra acessos indevidos | ATENDIDO | A/F | F anônimo/sem perfil/A↔B | E9 A/B, logout | Testes não são prova exaustiva de segurança |
| RNF-12 | Tempo adequado ao volume inicial | ATENDIDO | hooks/listas/R | F volume 400/R | E9 uso sem travamento observado | Medição local, sem SLA e sem afirmar escala ilimitada |
| RNF-13 | Listas sem travamento perceptível | ATENDIDO | FlatList/SectionList/R | Hooks/volume | E9 rolagem; E8 relatório extenso | Sem paginação; carregamento do período completo |
| RNF-14 | Separação de responsabilidades | ATENDIDO | src/ | TS/inspeção | E9 fluxos integrados | Telas, serviços, tipos, utils e estilos |
| RNF-15 | Componentes reutilizáveis | ATENDIDO | U | Inspeção/TS | E9 formulários/modal | AuthFormLayout/FormButton/ConfirmModal/FiltroSelecao |
| RNF-16 | Nomenclatura consistente | ATENDIDO | src/ | TS/inspeção | E9 rotas e textos | Português no domínio; estabelecimentoId único |

Fora de escopo: permissões detalhadas/convites, backup avançado, fornecedores,
códigos de barras/QR, fotos, exportação PDF/Excel, dashboard avançado, transferência
entre setores, auditoria detalhada de usuários, múltiplos estoques e integração
com vendas/pagamento/faturamento. Não há módulo comercial ou valores financeiros.

## Arquitetura e integridade

Decisões aprovadas substituem o esboço inicial: React Navigation, coleções
superiores em português e React Native Firebase 26.4.0 com SDK nativo Android.
Não foi introduzido SDK JavaScript paralelo. Domínio usa Date, convertido na
fronteira por `src/services/firebase/converters/`; navegação omite datas.

`quantidadeInicial` é metadado original imutável. Entrada inicial positiva é um
movimento real no mesmo batch do produto e contador de setor. Inicial zero não
gera movimento. A projeção `estoqueAtual` não é editável diretamente; cada
movimento cria/edita/exclui sua contribuição em transaction validada pelas Rules.
Histórico é a verdade lógica; a projeção deve sempre igualar entradas menos saídas.

Queries de estoque/relatórios exigem `estabelecimentoId == perfil atual`.
Produtos também filtram setor quando apropriado, histórico filtra produto e
relatório filtra intervalo no servidor. Leituras diretas de produto/movimento
revalidam estabelecimento/produto/setor dentro da transaction. Perfil é consultado
em `usuarios/{auth.uid}`; estabelecimento vem do perfil e é validado contra UID.
Nenhuma consulta global de negócio foi encontrada nos caminhos ativos.

Converters rejeitam IDs/tipos/vínculos/campos extras inválidos. Estimativa de
timestamp só é admitida para escrita explicitamente pendente nos contratos
permitidos. Formulários validam trim/limites/inteiros, bloqueiam duplo envio com
ref síncrona além do estado e não atualizam tela desmontada. Navegação tipada;
logout troca a árvore protegida. Hooks rejeitam dados de chave de sessão antiga
antes dos efeitos e callbacks tardios após cleanup. Relatório espera as três
fontes; erro fecha listeners e não publica falso resultado vazio.

| Assinatura ativa | Onde | Encerramento |
| --- | --- | --- |
| Auth: 1 | SessionProvider, durante vida do app | Unmount; versão invalida resposta de perfil antiga/logout |
| Setores: 1 | Tela Setores focada | Blur/unmount, UID/estabelecimento, retry |
| Produtos: 1 | Lista ou detalhes focados | Blur/unmount, UID/estabelecimento/setor, retry |
| Histórico: 1 | Detalhes focados | Blur/unmount, produto/setor/sessão, retry |
| Relatório: 3 | Relatórios focados | Blur/unmount, período/sessão/retry; erro fecha todos |

Formulários não abrem listeners de domínio. A rota anterior da stack permanece
montada, mas suas assinaturas são encerradas no blur. Testes separam render de
efeitos para verificar que uma troca de conta não publica resultados antigos,
inclusive antes do cleanup. Android A→B complementa esse teste; captura de cada
frame do render não foi usada como prova exaustiva de ausência de vazamento.
Pesquisa em `src/` não encontrou `any`, `as never`, `@ts-ignore` ou
`@ts-expect-error`. `Number.isSafeInteger` valida inteiro, finitude e precisão
centralmente, e movimentos ainda exigem >0; inicial/mínimo permitem zero.

Reposição: mínimo definido e saldo <= mínimo; mínimo ausente não indica reposição.
Relatório distingue saldo do período de estoque atual; sem movimento significa
nenhuma entrada nem saída no período, independente do filtro de tipo.
Mapas resolvem nomes sem N+1; rankings somam quantidades e respeitam filtros.

## Auditoria de segurança das Rules

Skill aplicada: `firebase-security-rules-auditor`. Avaliação JSON obrigatória:

```json
{
  "score": 5,
  "summary": "Sem bypass identificado no protocolo e nos caminhos avaliados. Autenticação, vínculo por perfil imutável, onboarding atômico, schema restrito, campos técnicos vinculados ao histórico e deltas não negativos foram confirmados por revisão e 446 cenários. Score refere-se às Rules, não ao conjunto de dependências ou a uma prova exaustiva.",
  "findings": []
}
```

Checklist: nega anônimo/sem perfil/A→B/B→A; onboarding não vincula conta a
estabelecimento alheio; perfil e dono não podem ser trocados; create e update
revalidam schema/tipos/limites e `hasOnly`; update só altera campos autorizados,
sem depender exclusivamente de `diff` para identidade. Tipo, criadoPor,
criadoEm, produto/setor/estabelecimento imutáveis; timestamps de escrita exigem
servidor. Strings/IDs/lista técnica limitada evitam payload arbitrário.

Não há regras abertas, OR permissivo ou coleção desconhecida liberada.
Saldo sozinho, movimento sozinho, múltiplos movimentos compartilhando delta,
replay, setor sem ajuste de contador, produto órfão e cascade incompleto são
negados. Exclusão de entrada/edição que produziria negativo falha integralmente.
Concorrência testa versões compartilhadas, conflitos e releitura; histórico e
projeção permanecem coerentes. Limite conservador evita extrapolar acessos de
Rules por cascade; aceitação no Emulator não garante orçamento de produção.

Rules publicadas foram comparadas com o arquivo local, normalizando apenas
CRLF/terminação: idênticas. SHA-256 local:
`425624106807ACF7009AEC86B93F6CCBED1CBA5097FD125710AC4D757A7E0C5E`.
Único índice composto listado: `movimentacoes`, escopo COLLECTION,
`estabelecimentoId ASC`, `criadoEm DESC`, `__name__ DESC`, ID `CICAgOjXh4EK`,
estado **READY**. Nenhum índice adicional ou deploy necessário.

## Testes automatizados e volume

- TypeScript: `npx tsc --noEmit`.
- Expo Doctor: 18/18 verificações.
- Lógica/serviços: 68 testes (64 anteriores + 3 hooks + 1 serialização de rotas).
- Auth/Firestore Rules Emulator: 446 cenários; os 445 existentes preservados.
- Build Android: `npx expo run:android --no-bundler`, sucesso em 2m7s, APK instalado.
- Android E2E: PASS, 360×740 e 411×891; cache, quatro escritas offline, restart,
  retry, signup A/B, isolamento, duplo submit, CRUD e cascade seguro.
- Export web: compilou; preserva apenas fallback de Firebase indisponível.
- Whitespace: `git diff --check` e check dos arquivos não versionados, sem problemas;
  avisos Git de conversão LF/CRLF não são erros de whitespace.
- `npm ls --depth=0`: árvore raiz válida; AsyncStorage removido sem atualizar
  versões dos demais pacotes comuns do lockfile.

Novo cenário de volume usa **apenas demo-estoque-local/localhost**: 20 produtos,
400 movimentos, queries reais do Emulator isoladas e período completo. Resultado:
400 entradas em unidades, 200 saídas, saldo 200, 400 registros, 20 produtos
distintos; nenhum truncamento. Leitura local 736ms; transpile + agregação 189ms.
Esses tempos não são benchmark puro de agregação nem SLA de produção/Android.
Não foram criados milhares de registros em produção.

## Android E2E e evidências

Development build recompilada e instalada no emulador Pixel 6 API36, inicialmente
em **360×740**. A e B foram criadas inteiramente pela UI Android: signup, criação
do estabelecimento, setor, produto e movimentos. Não houve seed ou ajuste manual
do banco para completar o E2E. REST autenticado foi usado somente para releituras
de conferência matemática/isolation; limpeza é uma atividade separada após o fluxo.

| Passo A, por UI | Saldo servidor/histórico | Resultado |
| --- | --- | --- |
| Produto inicial 10, mínimo 12 | 10, 1 movimento | PASS; entrada inicial automática, reposição |
| Entrada 5 | 15, 2 | PASS; reposição ausente |
| Saída 4 | 11, 3 | PASS; reposição presente |
| Editar entrada 5→8 | 14, 3 | PASS |
| Editar saída 4→6 | 12, 3 | PASS; igualdade com mínimo repõe |
| Cancelar exclusão de entrada | 12, 3 | PASS; nenhum dado removido |
| Excluir entrada 8 | 4, 2 | PASS |
| Excluir saída 6 | 10, 1 | PASS |
| Saída zero/saída 11 com saldo 10 | 10, 1 | PASS; rejeitadas |
| Sete entradas adicionais 1 | 11→17, 2→8 | PASS; ultrapassar seis não impede movimentar |
| Saída 2 | 15, 9 | PASS |
| Editar entrada adicional 1→2 | 16, 9 | PASS |
| Excluir saída 2 individualmente | 18, 8 | PASS |
| Cancelar/executar exclusão integral | 18, 8 | PASS; cascade bloqueado sem remoção |
| Editar descrição de produto/setor | 18, 8 | PASS; identidades e histórico preservados |
| Cancelar/excluir setor ocupado | 18, 8 | PASS; bloqueio explica produtos vinculados |
| Relatório atual | 18 entradas, 0 saídas, saldo 18, 8 registros | PASS |
| Filtros setor/produto/tipo saída | 0/0/0/0 | PASS; banco inalterado |
| Setembro sem registros | 0/0/0/0 | PASS; produto aparece sem movimento com estoque atual 18 |
| Abrir detalhes pelo relatório/limpar filtros | 18, 8 | PASS |
| Restart online, offline e retry online | 18, 8 | PASS; ver seção offline |

B: signup/onboarding próprios, setor/produto exclusivos, inicial zero/mínimo 5
(zerado e reposição destacados), entrada 5, saída 1. Conferência servidor:
saldo 4 e dois movimentos; relatório **5 entradas / 1 saída / saldo 4 / 2 registros**.
Telas de B vazias após onboarding, listas, detalhes e relatório foram inspecionadas
sem nomes de A. Consultas cruzadas reais A→B/B→A de setores/produtos/movimentos,
perfil e estabelecimento retornaram **403 PERMISSION_DENIED** em ambas as direções.
Os 446 testes complementam isolamento em updates/deletes/onboarding sem executar
ataques destrutivos contra dados de usuários reais.

Evidências principais: inicial,
saldo após correções,
saída bloqueada,
cascade bloqueado,
setor ocupado,
histórico até inicial,
relatório extenso,
filtros,
sem movimento,
B inicialmente vazio,
B zerado,
relatório exclusivo B.

Ainda na UI B: exclusão integral do produto com dois movimentos confirmou
cascade sem órfãos; depois setor vazio removido. Queries autenticadas confirmaram
zero setores/produtos/movimentos de B. Logout B → senha incorreta de A (erro
traduzido) → login correto A retomou saldo 18/oito movimentos, sem dados B.
Dois toques seguidos no mesmo submit de entrada produziram apenas um registro
(saldo 19/nove movimentos); sua remoção individual voltou a 18/oito. Nas demais
ações de escrita auditadas, ref síncrona de ocupado e disabled foram conferidos;
não se afirma teste de toque duplo nativo para cada formulário individual.

B após exclusões,
retorno ao produto A.

Em **411×891**, restart, detalhes e relatório novamente conferidos; saldo 18 e
resumo 18/0/18/8. Capturas detalhes maiores e
relatório maior inspecionadas visualmente.
Header, texto, botões e rolagem permaneceram acessíveis. As capturas em 360×740
também foram inspecionadas; evidência E8 complementa nome longo/teclado.

Logcat inspecionado: nenhum FATAL EXCEPTION do package nem padrões de exceção
JS/keys duplicadas/listas aninhadas encontrados no trecho coletado após correções.
Aviso de Date nos params foi observado antes da correção e não reapareceu nas
novas navegações/restarts. Warnings de tooling (NO_COLOR/FORCE_COLOR e deprecações
do Gradle em dependências) não são falhas do fluxo próprio; não houve atualização
de framework incidental para removê-los.

Limpeza final, separada do E2E: app deslogado; movimentos de A removidos
individualmente com deltas e Rules, produto/contador removidos atomicamente,
setor vazio removido. B já havia sido limpo por UI. Queries próprias confirmaram
zero setores/produtos/movimentos para ambos. Perfis e estabelecimentos temporários
removidos administrativamente; GET dos quatro caminhos confirmou NOT_FOUND.
Contas removidas via Firebase Auth; consulta administrativa pelos dois UIDs
confirmou `users: []`. Arquivo temporário de senhas/tokens foi removido.
Rede, tamanho e densidade originais restaurados; app permaneceu deslogado.

## Offline e persistência

**PASS, com limitação RNF-09 — ACEITÁVEL PARA MVP.** Native Android sem Wi-Fi
e dados móveis: sessão já validada permaneceu no estabelecimento e permitiu
leituras em cache de setores, produtos, histórico e relatórios. Relatório mostrou
o aviso de dados em cache/desatualizados/incompletos e manteve 18/0/18/8.

Tentativas reais de entrada, saída, edição e exclusão falharam com mensagens
traduzidas, sem sucesso, alteração de saldo ou criação/remoção de histórico.
Query autenticada independente no servidor confirmou saldo 18 e oito movimentos
após cada tentativa. Na primeira exclusão, o erro estava acima da região rolada;
foi corrigido `scrollToOffset(0)` no catch da tela e revalidada exclusão da entrada
inicial no fim do histórico: erro visível automaticamente, sem scroll manual.

Após force-stop e abertura offline, Auth nativo retomou a identidade, mas
`carregarPerfil` exigiu `getDocFromServer` para perfil/estabelecimento. A tela
mostrou “Não foi possível carregar sua sessão”, com retry e logout; não liberou
estoque nem onboarding incorreto a partir de ausência de rede. Reconectar e
“Tentar novamente” restaurou o estabelecimento/saldo 18. Nenhuma transação
rejeitada reapareceu na retomada. Reinício online também preservou sessão/dados.

Manter essa restrição evita criar autorização paralela baseada em cache. É
uma limitação explícita frente à sincronização de escritas offline do levantamento;
não se promete operação crítica offline. Escritas não críticas de metadados podem
ficar pendentes no SDK, com texto de aguardo; confirmação aguarda commit real.

Evidências: cache de relatório,
entrada,
saída,
edição,
exclusão e erro visível,
restart bloqueado.

## Performance e responsividade

FlatList no histórico/listas e SectionList no relatório oferecem uma área
principal de rolagem, sem listas verticais dentro de ScrollView vertical.
Agregação O(P+S+M), com ordenação de produtos/movimentos; três consultas fixas,
sem leitura por linha. Listener de setores/produtos agora é encerrado também no
blur, evitando listeners duplicados das rotas mantidas na stack.

Limite: carrega todos produtos/setores e os movimentos do período em memória;
sem paginação ou agregados de backend. Períodos grandes elevam leituras/memória.
O teste de 400 no Emulator confirma completude no volume auditado; não equivale
a teste Android com milhares de itens nem a garantia ilimitada de escala.

## Dependências e npm audit

Somente inventário/auditoria; **nenhum npm audit fix, force ou atualização geral**.
55 alertas: 1 low, 14 moderate, 38 high, 2 critical. Contagem inclui pacotes pais
afetados transitivamente, não 55 falhas independentes do app.

| Grupo/caminho | Relevância e decisão |
| --- | --- |
| `react-native → react-devtools-core → shell-quote` (critical) | Escaping de comandos Node; risco no tooling/devtools com entrada não confiável. App de estoque não executa shell em runtime Android. Registrar atualização controlada futura; não tratar severidade como irrelevante. |
| `expo → @expo/cli → tar` (critical) | Extração de arquivos no ambiente de desenvolvimento/build. Não é caminho de cadastro/movimentos Android; evitar artefatos não confiáveis e atualizar tooling em tarefa própria. |
| `query-string → decode-uri-component`, via React Navigation (moderate) | Potencial DoS no decoder de URI malformada. NavigationContainer atual não configura linking/deep links externos; nenhum fluxo do domínio decodifica dados do usuário com essa função. Rever antes de habilitar linking e em atualização compatível. |
| Metro/Expo CLI/Jest/Xcode/PostCSS/js-yaml/image-size/node-forge/xmldom e relacionados | Predominantemente desenvolvimento/build; presença transitiva não prova exploração no APK. Há risco no ambiente de desenvolvimento que deve ser acompanhado. |
| Node `ws`/`undici`/gRPC e SDK web compat transitivo | App importa RNFB e usa SDK Firebase nativo Android. Não usa esses clientes Node para operações Firestore/Auth mobile. Ferramentas de desenvolvimento podem alcançar dependências; não alegar ausência universal de exposição. |

Advisories primários: [shell-quote](https://github.com/advisories/GHSA-w7jw-789q-3m8p),
[tar](https://github.com/advisories/GHSA-vmf3-w455-68vh),
[decode-uri-component](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).
`npm explain` confirmou os caminhos citados; não se concluiu que todos os pacotes
marcados high/critical são vulneráveis em cada fluxo nativo. Avaliação do caminho
atual não substitui manutenção; planejar atualização compatível em trabalho separado.

## Configuração, segredos e código legado

Configuração cliente Android, package, projeto e alias conferidos. API key pública
do cliente não foi confundida com conta de serviço. Nenhuma chave privada,
service_account, refresh token ou JWT foi encontrada na varredura heurística dos
86 arquivos de texto não ignorados do workspace; revisão de configuração e
caminhos ativos complementou a varredura. Ela não constitui prova de ausência
em histórico Git ou arquivos ignorados. Nenhuma credencial real foi impressa
ou adicionada a docs/tests. Contas de teste usam credenciais temporárias fora
do repositório; testes Emulator têm guardas explícitas demo/localhost.

`.gitignore`: protege `.env`, `.env.*` (permite `.env.example`), logs, cobertura,
temporários, APK/AAB, diretórios nativos/build/cache já ignorados. `google-services.json`
continua versionável por decisão autorizada anterior, como configuração pública.
Sem uso de localStorage/sessionStorage ou AsyncStorage ativo.

Removidos por ausência de imports: `src/components/GenericModal.tsx`,
`src/styles/produtoFormScreen.styles.ts`, `src/styles/setorFormScreen.styles.ts`.
`@react-native-async-storage/async-storage` era dependência direta sem consumidor
ativo; a ligação encontrada em Firebase JS auth é peer opcional, não persistência
usada pelo app nativo. Remoção do pacote foi seguida de Doctor e build Android.
Remoções antigas de vendas/storage/protótipo e mudanças preexistentes no Git
foram preservadas; não pertencem à Etapa 9.

## Limitações finais e evolução futura

1. Cascade: opção **A**, manter até seis e prova completa de IDs. Histórico acima
   do limite pode continuar recebendo entradas/saídas, edições/exclusões individuais
   e relatórios. Registro antes parcial pode bloquear cascade mesmo após redução
   para <=6; não reparar nem excluir parcialmente. UI informa histórico extenso ou
   impossibilidade de confirmar exclusão completa, sem expor orçamento/backend.
2. Operações críticas de estoque somente online; cache não é sucesso de escrita.
   Restart offline exige confirmação de perfil/estabelecimento no servidor. Mantido
   como limitação aceitável autorizada do MVP, para não liberar sessão por cache.
3. Um administrador proprietário por estabelecimento; mesma conta pode sincronizar
   vários dispositivos. Convites e múltiplos usuários administráveis ficam futuros.
4. Export web compilou sem erro, mas Firebase nativo continua indisponível na web;
   esse build não representa suporte funcional ao estoque web. iOS apenas preparação parcial, sem
   GoogleService-Info.plist/registro Firebase/build validado. Não prometido pronto.
5. Inteiros seguros; sem unidades fracionárias, exportação ou módulo comercial.
6. Relatórios sem paginação; volume grande exige evolução sem truncar totais.
7. Alertas npm/tooling registrados, sem atualização incidental. Teste de emulador
   não substitui avaliação de dispositivo físico e pacote de distribuição release.

Backend confiável para cascade maior, paginação/agregação de relatórios, atualização
controlada de dependências e suporte iOS/web são trabalhos futuros, não iniciados.

## Arquivos alterados nesta etapa

Modificados: `.gitignore`, `package.json`, `package-lock.json`, `README.md`,
`docs/ARQUITETURA.md`, hooks `useSetores.ts`/`useProdutos.ts`,
`src/navigation/types.ts`, telas Setores/Produtos/ProdutoDetalhes/Relatorios,
`src/utils/movimentacoes.ts`, textos de plataforma em utils auth/setores/produtos,
serviços web de movimentos/produtos/relatórios e CredenciaisScreen,
`tests/produtos.test.cjs`, `tests/firebase-rules.test.cjs`.
Criados: `src/navigation/dadosDeRota.ts`, `tests/listeners.test.cjs`,
`tests/navigation.test.cjs`, este documento e capturas `validacoes/etapa9-*.png`.
Removidos: os três arquivos mortos citados acima. Outros itens do `git status`
precedem esta etapa; nenhum commit ou reversão de trabalho anterior.

## Conclusão

**MVP APROVADO PARA ENTREGA**, para a plataforma Android e o escopo com limitações
explicitamente autorizadas. Nenhuma pendência bloqueante encontrada nos caminhos
auditados; não significa suporte iOS/web funcional, offline transacional ou cascade
ilimitado. Matriz, testes e Android real em development build sustentam o resultado.
Nenhum commit, deploy de Rules/índices, backend, etapa seguinte ou preparação de
apresentação foi iniciado. Alterações preexistentes do workspace preservadas.
