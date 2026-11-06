# Sistema de Controle de Estoque por Setores

## Objetivo do projeto

Desenvolver um aplicativo mobile para controle de estoque organizado por setores.

O sistema substituirá registros manuais feitos em agenda, papel ou anotações
soltas por uma solução digital para controlar setores, produtos, entradas,
saídas, estoque disponível, histórico de movimentações e relatórios.

O sistema deve permitir ao administrador identificar:

- Produtos disponíveis em cada setor
- Estoque atual de cada produto
- Produtos com maior entrada
- Produtos com maior saída
- Produtos sem movimentação
- Produtos com estoque zerado
- Produtos que necessitam de reposição

---

## Escopo funcional

O sistema deverá permitir:

1. Autenticar usuários autorizados.
2. Criar e acessar um estabelecimento.
3. Cadastrar, listar, editar e excluir setores.
4. Cadastrar, listar, editar e excluir produtos vinculados a setores.
5. Definir quantidade inicial e estoque mínimo por produto.
6. Registrar entradas de estoque.
7. Registrar saídas de estoque.
8. Calcular automaticamente o estoque atual de cada produto.
9. Consultar o histórico de movimentações de cada produto.
10. Editar e excluir movimentações.
11. Consultar relatórios de movimentações.
12. Filtrar relatórios por período, setor, produto e tipo de movimentação.
13. Identificar produtos com maior saída, maior entrada, sem movimentação,
    estoque zerado e necessidade de reposição.
14. Armazenar e sincronizar dados utilizando Firebase.

---

## Fora do escopo

O sistema **não possui módulo de vendas**.

Não implementar:

- Cadastro de clientes
- Preços de produtos
- Formas de pagamento
- Caixa
- Faturamento
- Descontos
- Comissões
- Cadastro de vendas
- Relatório financeiro de vendas
- Integração com meios de pagamento

Uma saída poderá utilizar futuramente o motivo `venda`, mas isso não cria um
módulo comercial e não envolve cliente, preço, pagamento ou faturamento.

---

## Tecnologias obrigatórias

Utilizar:

- React Native
- Expo
- TypeScript
- React Navigation
- Firebase JavaScript SDK
- Firebase Authentication
- Cloud Firestore
- Firestore Security Rules
- Expo Vector Icons, quando necessário

A experiência principal é Android, mas o aplicativo também deve funcionar na
versão web durante o desenvolvimento.

Antes de instalar qualquer dependência:

1. Verificar o `package.json`.
2. Confirmar se a dependência já existe.
3. Justificar por que ela é necessária.
4. Não instalar pacotes que não sejam indispensáveis.

---

## Modelo de dados

### Setor

```ts
type Setor = {
  id: string;
  establishmentId: string;
  nome: string;
  descricao?: string;
  criadoEm: Date | Timestamp;
  atualizadoEm?: Date | Timestamp;
};
```

### Produto

```ts
type Produto = {
  id: string;
  establishmentId: string;
  setorId: string;
  nome: string;
  descricao?: string;
  quantidadeInicial: number;
  estoqueMinimo?: number;
  criadoEm: Date | Timestamp;
  atualizadoEm?: Date | Timestamp;
};
```

### Movimentação

```ts
type TipoMovimentacao = 'entrada' | 'saida';

type Movimentacao = {
  id: string;
  establishmentId: string;
  produtoId: string;
  setorId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string;
  observacao?: string;
  criadoEm: Date | Timestamp;
  atualizadoEm?: Date | Timestamp;
  criadoPor: string;
};
```

### Usuário

```ts
type PapelUsuario = 'admin';

type Usuario = {
  id: string;
  establishmentId: string;
  nome?: string;
  email: string;
  papel: PapelUsuario;
  criadoEm: Date | Timestamp;
};
```

Na primeira versão, implementar apenas o papel `admin`.

---

## Estrutura do Cloud Firestore

Os dados devem ser isolados por estabelecimento.

```text
establishments
  └── {establishmentId}
      ├── nome
      ├── criadoEm
      ├── criadoPor
      │
      ├── members
      │   └── {userId}
      │       ├── nome
      │       ├── email
      │       ├── papel: "admin"
      │       └── criadoEm
      │
      ├── sectors
      │   └── {sectorId}
      │       ├── nome
      │       ├── descricao
      │       ├── criadoEm
      │       └── atualizadoEm
      │
      ├── products
      │   └── {productId}
      │       ├── setorId
      │       ├── nome
      │       ├── descricao
      │       ├── quantidadeInicial
      │       ├── estoqueMinimo
      │       ├── criadoEm
      │       └── atualizadoEm
      │
      └── movements
          └── {movementId}
              ├── produtoId
              ├── setorId
              ├── tipo: "entrada" | "saida"
              ├── quantidade
              ├── motivo
              ├── observacao
              ├── criadoEm
              ├── atualizadoEm
              └── criadoPor
```

### Regras de modelagem

- Todo setor deve possuir `establishmentId`.
- Todo produto deve possuir `establishmentId` e `setorId`.
- Toda movimentação deve possuir `establishmentId`, `produtoId` e `setorId`.
- O usuário não escolhe manualmente o setor de uma movimentação.
- O `setorId` da movimentação deve ser obtido a partir do produto selecionado.
- Salvar `setorId` na movimentação é obrigatório para facilitar relatórios por setor.
- Não salvar `estoqueAtual` como fonte de verdade no produto.
- O estoque atual deve ser calculado a partir das movimentações.
- Dados derivados, caso sejam criados futuramente para desempenho, devem ser
  atualizados de forma consistente e nunca substituir o histórico como verdade.

---

## Regras de negócio obrigatórias

### Produtos e setores

- Todo produto pertence a exatamente um setor.
- Um produto não pode existir sem `setorId`.
- Um setor não pode ser excluído enquanto possuir produtos vinculados.
- Ao bloquear a exclusão, informar claramente o motivo.

Mensagem sugerida:

```text
Este setor possui produtos cadastrados. Remova os produtos antes de excluir o setor.
```

### Movimentações

- Toda movimentação pertence a exatamente um produto.
- Uma movimentação não pode existir sem `produtoId`.
- Toda movimentação deve possuir tipo `entrada` ou `saida`.
- Quantidade deve ser numérica e maior que zero.
- Não aceitar quantidade vazia, zero ou negativa.
- Toda movimentação deve possuir data de criação.
- Toda movimentação deve registrar `criadoPor` com o usuário autenticado.

### Cálculo de estoque

O estoque atual deve ser calculado exclusivamente por:

```text
estoqueAtual = totalDeEntradas - totalDeSaidas
```

Regras:

- Entrada aumenta o estoque.
- Saída diminui o estoque.
- O sistema nunca pode permitir estoque negativo.
- O saldo mostrado na lista e nos detalhes deve ser obtido do histórico.
- Criar, editar ou excluir movimentações deve atualizar o saldo.
- Criar, editar ou excluir movimentações deve atualizar os dados do relatório.

### Estoque inicial

- Todo produto possui `quantidadeInicial`.
- A quantidade inicial deve ser maior ou igual a zero.
- Se `quantidadeInicial > 0`, criar automaticamente uma movimentação com:
  - `tipo`: `entrada`
  - `quantidade`: igual à quantidade inicial
  - `motivo`: `Estoque inicial`
  - `observacao`: `Estoque inicial`
  - `criadoEm`: mesma data de criação do produto
- Se a quantidade inicial for zero, não criar movimentação inicial.
- O saldo não pode depender de um campo estático fora do histórico.

### Estoque mínimo e reposição

- `estoqueMinimo` é opcional.
- Quando informado, deve ser maior ou igual a zero.
- Um produto exige reposição quando:

```text
estoqueAtual <= estoqueMinimo
```

- Produto com saldo igual a zero deve ser destacado.
- Produtos abaixo ou iguais ao estoque mínimo devem ser destacados nos relatórios.

### Edição de movimentações

- Editar uma movimentação deve recalcular o estoque.
- Ao editar saída, considerar que a movimentação antiga será substituída.
- Nunca considerar a movimentação antiga e a nova simultaneamente no cálculo.
- A edição não pode gerar estoque negativo.

### Exclusões

- Toda exclusão deve utilizar modal de confirmação.
- Excluir produto deve excluir suas movimentações vinculadas.
- Não deixar movimentações órfãs.
- Excluir movimentação deve recalcular saldo e atualizar histórico.
- O modal deve informar o impacto da exclusão.

Mensagem sugerida para produto:

```text
Ao excluir este produto, todas as movimentações vinculadas a ele também serão removidas. Deseja continuar?
```

### Histórico

- Mostrar somente movimentações do produto selecionado.
- Ordenar da mais recente para a mais antiga.
- Cada registro deve exibir:
  - Tipo
  - Quantidade
  - Data
  - Observação
  - Ação de editar
  - Ação de excluir
- Todo o histórico deve ser acessível por rolagem vertical.

---

## Relatórios

Relatórios trabalham com **quantidade**, não com valores financeiros.

Deverá ser possível filtrar por:

- Período inicial
- Período final
- Setor
- Produto
- Tipo de movimentação: entrada ou saída

O relatório deverá apresentar:

- Total de entradas no período
- Total de saídas no período
- Quantidade de produtos movimentados
- Entradas e saídas agrupadas por setor
- Produtos com maior saída
- Produtos com maior entrada
- Produtos sem movimentação
- Produtos com estoque zerado
- Produtos abaixo ou iguais ao estoque mínimo

Regras:

- Filtros nunca podem alterar os dados armazenados.
- Relatórios devem usar somente movimentações válidas do período selecionado.
- Produtos sem movimentação continuam cadastrados e devem aparecer quando solicitado.
- Deve ser possível abrir os detalhes de um produto pelo relatório.
- Rankings devem respeitar os filtros aplicados.
- Maior saída deve ser ordenada do maior para o menor total.
- Maior entrada deve ser ordenada do maior para o menor total.

---

## Firebase e segurança

### Fonte de verdade

- Cloud Firestore é a fonte principal de dados.
- Não usar AsyncStorage como fonte principal para setores, produtos ou movimentações.
- AsyncStorage só pode ser usado para preferências locais não críticas, quando necessário.
- Não usar `localStorage` ou `sessionStorage`.

### Autenticação

- Usar Firebase Authentication.
- Usuário não autenticado não pode acessar dados do estoque.
- A primeira versão implementa apenas o administrador.
- O administrador acessa somente os dados do próprio estabelecimento.
- Implementar logout.

### Firestore Security Rules

- Nunca utilizar regras abertas em produção.
- Leituras e escritas devem exigir autenticação.
- Usuário só pode acessar dados do estabelecimento ao qual pertence.
- Proteção na interface não substitui Firestore Security Rules.
- As regras devem validar a associação entre usuário e estabelecimento.
- As regras devem impedir leitura e escrita de dados de outros estabelecimentos.

### Configuração e variáveis de ambiente

- A configuração do Firebase deve ficar isolada em `src/config/firebase.ts`.
- Usar variáveis de ambiente compatíveis com Expo.
- Não fazer commit de arquivos `.env`.
- Não colocar senhas, chaves administrativas ou contas de serviço no aplicativo.
- Não usar credenciais administrativas no cliente.
- Usar timestamps do Firestore quando apropriado.

---

## Interface e navegação

- Preservar o padrão de header e navegação existente, salvo instrução explícita.
- Não remover o header como forma de resolver problemas de layout.
- Todo conteúdo longo deve ter rolagem vertical funcional.
- Não usar `ScrollView` vertical dentro de outro `ScrollView` vertical.
- Evitar `FlatList` dentro de `ScrollView` vertical.
- Em detalhes de produto, usar uma única área vertical principal de rolagem.
- Nenhum item do histórico pode ficar inacessível em tela pequena.
- Validar telas em aproximadamente `360 x 740` pixels.
- Usar estados vazios claros para setores, produtos, movimentações e relatórios.
- Toda ação destrutiva deve usar modal de confirmação.
- Não depender apenas de cor para comunicar estados.
- Todos os textos devem estar em português brasileiro.
- Botões devem possuir área de toque adequada.

---

## Arquitetura e organização

Manter organização clara:

```text
src/
  components/      Componentes reutilizáveis
  config/          Configuração do Firebase
  navigation/      Navegadores e rotas
  screens/         Telas
  services/        Acesso ao Firebase e serviços do domínio
  styles/          Estilos
  types/           Tipos TypeScript
  utils/           Cálculos, validações e utilitários
```

Estrutura sugerida:

```text
src/
  components/
    ConfirmModal/
    EmptyState/
    ScreenContainer/
  config/
    firebase.ts
  navigation/
    AppNavigator.tsx
    StockStackNavigator.tsx
  screens/
    auth/