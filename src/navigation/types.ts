import type { StackScreenProps } from '@react-navigation/stack';
import type { Setor } from '../types/setor.types';
import type { Produto } from '../types/produto.types';
import type { Movimentacao, TipoMovimentacao } from '../types/movimentacao.types';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type DadosRota<T> = Omit<T, 'criadoEm' | 'atualizadoEm' | 'inativadoEm'>;
export type RootStackParamList = { Loading: undefined; Auth: undefined; Onboarding: undefined; Stock: undefined; Conta: undefined; Error: undefined };

export type StockStackParamList = {
  Setores: undefined;
  SelecaoEstoque: { acao: 'produto' | 'entrada' | 'saida' };
  SetorForm: { setor?: DadosRota<Setor> } | undefined;
  Produtos: { setor: DadosRota<Setor> };
  ProdutoForm: { setor: DadosRota<Setor>; produto?: DadosRota<Produto> };
  ProdutoDetalhes: { setor: DadosRota<Setor>; produtoId: string };
  MovimentacaoForm: { setor: DadosRota<Setor>; produtoId: string; tipo: TipoMovimentacao; movimentacao?: DadosRota<Movimentacao> };
};

export type AuthenticatedTabParamList = {
  Inicio: undefined;
  Estoque: NavigatorScreenParams<StockStackParamList> | undefined;
  Movimentacoes: undefined;
  Relatorios: undefined;
};

export type StockScreenProps<RouteName extends keyof StockStackParamList> =
  StackScreenProps<StockStackParamList, RouteName>;
