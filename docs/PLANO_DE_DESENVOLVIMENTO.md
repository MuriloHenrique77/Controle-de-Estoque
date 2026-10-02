# Plano de Desenvolvimento

## Princípios de execução

O desenvolvimento deve ser feito em etapas pequenas e testáveis.

Cada funcionalidade deverá:

- Ter objetivo definido
- Possuir critérios de aceite
- Ser testada antes da próxima etapa
- Não alterar funcionalidades fora do escopo
- Preservar as regras de estoque e integridade dos dados
- Respeitar autenticação e regras de segurança do Firebase

## Ordem de implementação

1. Configuração do ambiente e da estrutura do projeto
2. Configuração do Firebase
3. Firebase Authentication
4. Estrutura de estabelecimento e perfil de administrador
5. Tipos de dados do sistema
6. Serviços de persistência com Cloud Firestore
7. Gestão de setores
8. Gestão de produtos
9. Criação automática de estoque inicial
10. Registro de entradas
11. Registro de saídas
12. Cálculo e validação de estoque
13. Detalhes e histórico do produto
14. Edição e exclusão de movimentações
15. Regras de exclusão de produtos e setores
16. Relatórios de movimentações
17. Indicadores de reposição
18. Testes, responsividade e documentação

## Etapa 1 — Firebase e autenticação

- Configurar Firebase JavaScript SDK compatível com Expo
- Criar arquivo de configuração do Firebase
- Configurar variáveis de ambiente
- Configurar Firebase Authentication
- Criar fluxo inicial de login
- Criar fluxo de logout
- Criar ou associar um estabelecimento ao administrador autenticado
- Criar Firestore Security Rules iniciais
- Validar proteção de leitura e escrita

## Etapa 2 — Estrutura do domínio

- Criar tipos Setor, Produto, Movimentacao e Usuario
- Incluir `establishmentId` nas entidades
- Incluir `setorId` no produto
- Incluir `produtoId` e `setorId` na movimentação
- Incluir `quantidadeInicial` e `estoqueMinimo` no produto
- Criar serviços para acesso ao Firestore
- Separar regras de negócio da interface

## Etapa 3 — Setores

- Criar setor
- Listar setores
- Editar setor
- Excluir setor vazio
- Bloquear exclusão de setor com produtos
- Exibir estado vazio quando não houver setores

## Etapa 4 — Produtos

- Criar produto vinculado a setor
- Listar produtos do setor
- Editar produto
- Excluir produto
- Definir quantidade inicial
- Definir estoque mínimo
- Exibir estado vazio quando não houver produtos

## Etapa 5 — Movimentações e estoque

- Criar movimentação automática de estoque inicial
- Registrar entrada
- Registrar saída
- Validar quantidade maior que zero
- Impedir estoque negativo
- Calcular estoque atual
- Atualizar estoque após toda movimentação

## Etapa 6 — Detalhes e histórico

- Exibir detalhes do produto
- Exibir saldo atual
- Exibir histórico de movimentações
- Ordenar histórico por data
- Garantir rolagem completa do histórico
- Editar movimentação
- Excluir movimentação
- Atualizar saldo automaticamente

## Etapa 7 — Relatórios

- Criar tela de relatórios
- Filtrar por período
- Filtrar por setor
- Filtrar por produto
- Filtrar por tipo de movimentação
- Mostrar totais de entrada e saída
- Mostrar dados agrupados por setor
- Mostrar produtos com maior saída
- Mostrar produtos com maior entrada
- Mostrar produtos sem movimentação
- Mostrar produtos com estoque zerado
- Mostrar produtos que precisam de reposição

## Etapa 8 — Qualidade e entrega

- Testar todos os fluxos de setores
- Testar todos os fluxos de produtos
- Testar entradas e saídas
- Testar bloqueio de estoque negativo
- Testar exclusões e confirmações
- Testar relatórios e filtros
- Testar Firestore Security Rules
- Testar em tela pequena
- Testar no navegador
- Testar no Android ou Expo Go, quando possível
- Atualizar documentação de execução do projeto