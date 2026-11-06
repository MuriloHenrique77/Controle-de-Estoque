# Validação da Etapa 10B — ciclo de vida dos produtos

Data: 06/10/2026. Resultado: **ETAPA 10B APROVADA**.

## Checkpoint 10A

Antes de alterar qualquer arquivo da 10B: TypeScript PASS, Expo Doctor 18/18, lógica/serviços 80/80, Rules Emulator 446/446, diff --check PASS. Commit exclusivo da 10A: 93673216f4df72d3811cb3e7fec60147ac8d84fd — feat: adiciona home, design system e navegacao principal. Working tree limpa após commit. A 10B permanece sem commit.

## Validações finais

| Verificação | Resultado |
| --- | --- |
| TypeScript — tsc --noEmit | PASS |
| Expo Doctor | PASS — 18/18 |
| Lógica/serviços existentes e novos | PASS — 89/89; 80 anteriores + 9 novos |
| Firebase Rules Emulator | PASS — 498/498; 446 anteriores + 52 novos |
| firebase-security-rules-auditor | PASS — score 5, findings vazios no escopo verificado |
| Compilação das Rules / dry-run | PASS |
| Deploy somente firestore:rules | PASS — controle-de-estoque---tcc, database (default) STANDARD |
| Android development build | PASS — APK nativo da 10A reutilizado; atualização JS/TS da 10B carregada pelo Metro |
| git diff --check e arquivos de texto novos | PASS |

Nenhuma dependência adicionada, nenhuma alteração de índice e nenhum deploy de outro recurso. Hash SHA256 do arquivo de Rules publicado: FB53FAFAC80F05099989409C266DDB9594322B22EFB485D22740A3C749195CC7. Auditoria em [AUDITORIA_RULES_ETAPA_10B.json](AUDITORIA_RULES_ETAPA_10B.json). As conclusões se limitam às invariantes revisadas e aos cenários executados; não constituem garantia exaustiva.

## Modelo, operações e legado

PASS: criação inicial 0 gera ativo/false/null/null; inicial positiva gera ativo/true junto da entrada inicial. Primeira movimentação marca true atomicamente. Excluir o último movimento não volta para false nem libera exclusão do produto.

PASS: inativação e reativação preservam estoque, inicial, mínimo, vínculos e histórico. Inativação positiva exibe aviso de saldo; autoria/data exigem UID atual e timestamp do servidor. Reativar limpa autoria/data. Metadados comuns não manipulam ciclo nem marcador.

PASS: status ausente é ativo; marcador ausente é undefined no domínio e bloqueia delete conservadoramente. Legado recebe movimentação, pode inativar/reativar e continua protegido. Não houve migração em massa.

PASS: produto inativo bloqueia criação, edição e exclusão de movimentos nos serviços, UI e Rules. Leituras históricas continuam permitidas. A/B nos dois sentidos, anônimo e manipulações de schema/auditoria/marcador foram negados.

PASS: delete só ocorre com marcador explicitamente false, estoque/inicial/contagem zero e registro vazio; remove somente produto e decrementa contador do setor atomicamente. RN-08 considera ativos e inativos e protege contra setor órfão.

## Cascade antigo

Removidos: consulta completa e loop de deleção de movimentos no removerProduto; validarCascade; função completeCascade das Rules; permissão de delete de movimento junto do produto. Mantido o registro técnico de até seis IDs, renomeado para LIMITE_REGISTRO_MOVIMENTACOES, porque criação/edição/exclusão individual ainda usa esse protocolo. O histórico continua sem limite de seis registros. Testes anteriores de cascade foram preservados como cenários de negação da nova política, com documentos intactos.

## Home e relatórios

PASS: Home conta apenas ativos (incluindo legado sem status); reposição/zerados só ativos. Recentes/global preservam todos os movimentos, com indicação Inativo. Seleção de novo movimento não oferece inativos.

PASS: totais, rankings, agrupamento por setor e produtos movimentados do período preservam inativos. Reposição, zerados e sem movimentação são indicadores do catálogo ativo atual. Sem movimentação ignora filtro de tipo e exige ausência de entrada e saída no período. Essa decisão está documentada na arquitetura e indicada na interface.

## Android — E2E visível em 360×740

Pixel_6_API_36 existente iniciado sem headless/no-window; janela forçada a 440×750, posição 1066,60–1506,810 no monitor principal. IsWindowVisible e limites da WorkingArea confirmados. adb device e sys.boot_completed=1 antes dos testes. Nenhuma interface do Android Studio aberta.

1. Login com conta sintética, setor e legado real no Firestore.
2. Criar produto inicial 0, confirmar exclusão permanente e observar snackbar de sucesso.
3. Criar produto inicial 10, tentar delete e confirmar bloqueio por histórico.
4. Inativar com aviso de 10 unidades; produto sai de Ativos e aparece em Inativos.
5. Detalhes preservam saldo 10 e entrada inicial; entrada/saída e editar/excluir movimento desabilitados. Histórico acessível por rolagem.
6. Reativar, retornar a Ativos, registrar entrada de 2; saldo 12. Definir mínimo 20 para comprovar reposição atual.
7. Inativar novamente: Home passa de 2 produtos/1 reposição/1 zerado para 1/0/1.
8. Legado sem status/marcador aparece ativo; delete bloqueado com mensagem conservadora. Inativar, reativar, registrar primeira entrada de 1 e inativar novamente.
9. Com ambos inativos, Home apresenta 0 produtos/0 reposição/0 zerados; novo movimento apresenta Nenhum produto ativo.
10. Global e relatórios mantêm três entradas. Relatório: entradas 13, saídas 0, três movimentos e dois produtos movimentados. Rankings preservam 12 e 1; relatório abre detalhes inativos. Atenção atual: nenhuma reposição ou zerado ativo.
11. Tentar excluir setor com dois produtos inativos: RN-08 bloqueia e explica o vínculo.
12. Logout confirmado.

30 capturas Android reais em docs/validacoes/etapa10b-*.png. Visibilidade mantida durante os testes; overrides temporários 360×740/density160 restaurados ao final para 1080×2400/density420. Preferência temporária de teclado restaurada (chave removida). Emulador permanece aberto/visível no Login.

## Limpeza de teste

Conta Auth sintética excluída e users: [] confirmado. Oito documentos exclusivos da fixture removidos administrativamente e ausência confirmada (três movimentos, dois produtos, um setor, perfil e estabelecimento). Essa limpeza de fixture não é uma operação oferecida pelo aplicativo e não altera a política de preservação do histórico de usuários. Credenciais temporárias não foram versionadas; arquivo temporário de credenciais removido.

## Arquivos modificados

- README.md
- docs/ARQUITETURA.md
- firestore.rules
- src/components/ConfirmModal.tsx
- src/components/MovimentoCard.tsx
- src/components/ui/FeedbackProvider.tsx
- src/navigation/dadosDeRota.ts
- src/navigation/types.ts
- src/screens/relatorios/RelatoriosScreen.tsx
- src/screens/setores/MovimentacaoFormScreen.tsx
- src/screens/setores/ProdutoDetalhesScreen.tsx
- src/screens/setores/ProdutosScreen.tsx
- src/screens/setores/SelecaoEstoqueScreen.tsx
- src/services/firebase/converters/produto.ts
- src/services/movimentacoes/movimentacoesService.ts
- src/services/produtos/produtosService.ts
- src/services/produtos/produtosService.web.ts
- src/types/produto.types.ts
- src/utils/movimentacoes.ts
- src/utils/relatorios.ts
- src/utils/setores.ts
- src/utils/visaoEstoque.ts
- tests/firebase-rules.test.cjs
- tests/produtos.test.cjs

## Arquivos criados

- docs/AUDITORIA_RULES_ETAPA_10B.json
- docs/VALIDACAO_ETAPA_10B.md
- docs/validacoes/etapa10b-entrada-apos-reativacao-360.png
- docs/validacoes/etapa10b-global-inativos-360.png
- docs/validacoes/etapa10b-historico-delete-bloqueado-360.png
- docs/validacoes/etapa10b-home-exclui-inativo-360.png
- docs/validacoes/etapa10b-home-inicial-360.png
- docs/validacoes/etapa10b-home-produto-ativo-360.png
- docs/validacoes/etapa10b-home-todos-inativos-360.png
- docs/validacoes/etapa10b-inativacao-aviso-saldo-360.png
- docs/validacoes/etapa10b-inativado-sucesso-360.png
- docs/validacoes/etapa10b-inativo-detalhes-360.png
- docs/validacoes/etapa10b-inativo-historico-360.png
- docs/validacoes/etapa10b-legado-ativo-360.png
- docs/validacoes/etapa10b-legado-delete-bloqueado-360.png
- docs/validacoes/etapa10b-legado-entrada-360.png
- docs/validacoes/etapa10b-legado-inativo-360.png
- docs/validacoes/etapa10b-lista-inativos-360.png
- docs/validacoes/etapa10b-login-final-360.png
- docs/validacoes/etapa10b-positivo-detalhes-360.png
- docs/validacoes/etapa10b-rankings-inativos-360.png
- docs/validacoes/etapa10b-reativacao-confirmacao-360.png
- docs/validacoes/etapa10b-reativado-lista-ativos-360.png
- docs/validacoes/etapa10b-reativado-sucesso-360.png
- docs/validacoes/etapa10b-relatorio-abre-inativo-360.png
- docs/validacoes/etapa10b-relatorio-atencao-ativos-360.png
- docs/validacoes/etapa10b-relatorio-historico-360.png
- docs/validacoes/etapa10b-relatorio-movimentos-inativos-360.png
- docs/validacoes/etapa10b-rn08-inativos-360.png
- docs/validacoes/etapa10b-selecao-ignora-inativos-360.png
- docs/validacoes/etapa10b-zero-confirmacao-360.png
- docs/validacoes/etapa10b-zero-excluido-360.png
- src/components/ProdutoLifecycleActions.tsx
- src/utils/cicloProduto.ts
- tests/ciclo-produto.test.cjs
- tests/helpers/produtos-ambiente.cjs

## Arquivos removidos

Nenhum arquivo inteiro removido. Código de cascade obsoleto removido dos arquivos indicados.

## Pendências

Nenhuma pendência no escopo da Etapa 10B. Validação executada em emulador Android; dispositivo físico, iOS e Firebase Web estão fora desta etapa.
