# Visão do Produto

## Nome

Sistema de Controle de Estoque por Setores.

## Problema

Estabelecimentos podem controlar produtos por agenda, papel ou anotações
manuais. Esses registros podem ser perdidos, rasurados, incompletos e difíceis
de consultar.

Esse tipo de controle também dificulta identificar:

- Quais produtos estão disponíveis
- Quais produtos tiveram mais saída
- Quais produtos precisam de reposição
- Quais produtos permanecem sem movimentação
- Quais setores possuem maior movimentação

## Solução

O aplicativo centraliza o controle de setores, produtos e movimentações de
estoque.

Ele permitirá registrar entradas e saídas, consultar o estoque atual, manter
histórico de movimentações e analisar relatórios por período, setor, produto e
tipo de movimentação.

Os dados serão armazenados em nuvem utilizando Firebase, permitindo que o
estabelecimento mantenha suas informações centralizadas e sincronizadas entre
dispositivos autorizados.

## Usuários

- Administrador do estabelecimento
- Responsável pelo estoque
- Operador responsável por registrar entradas e saídas
- Gestor que consulta a situação do estoque

Na primeira versão, será implementado apenas o perfil de administrador.

## Funcionalidades principais

- Autenticação de usuários
- Cadastro e organização de setores
- Cadastro e organização de produtos por setor
- Registro de estoque inicial
- Registro de entradas e saídas
- Cálculo automático do estoque atual
- Histórico de movimentações
- Controle de estoque mínimo
- Relatórios de entradas e saídas
- Filtros por período, setor, produto e tipo de movimentação
- Identificação de produtos com maior entrada
- Identificação de produtos com maior saída
- Identificação de produtos sem movimentação
- Identificação de produtos que precisam de reposição
- Sincronização dos dados em nuvem

## Dados e segurança

- Firebase Authentication identificará usuários autorizados.
- Cloud Firestore será o banco de dados principal.
- Cada conjunto de dados pertencerá a um estabelecimento.
- Usuários autenticados deverão acessar apenas dados do estabelecimento ao qual
  pertencem.
- Firestore Security Rules deverão proteger leituras e escritas.
- O aplicativo não deverá usar AsyncStorage como fonte principal dos dados de
  setores, produtos ou movimentações.

## Fora do escopo

- Vendas
- Clientes
- Preços
- Formas de pagamento
- Caixa
- Faturamento
- Relatórios financeiros
- Integração com meios de pagamento
- Controle de múltiplos perfis além de administrador na primeira versão

## Resultado esperado

O administrador deve conseguir saber:

- Quais setores existem no estabelecimento
- Quais produtos existem em cada setor
- Quanto há disponível de cada produto
- O que entrou e saiu em determinado período
- Quais produtos estão acabando
- Quais produtos têm maior saída
- Quais produtos tiveram maior entrada
- Quais produtos não tiveram movimentação
- Quais produtos precisam de reposição