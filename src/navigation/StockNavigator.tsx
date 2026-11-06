import { createStackNavigator } from '@react-navigation/stack';
import SetoresScreen from '../screens/setores/SetoresScreen';
import SetorFormScreen from '../screens/setores/SetorFormScreen';
import ProdutosScreen from '../screens/setores/ProdutosScreen';
import ProdutoFormScreen from '../screens/setores/ProdutoFormScreen';
import ProdutoDetalhesScreen from '../screens/setores/ProdutoDetalhesScreen';
import MovimentacaoFormScreen from '../screens/setores/MovimentacaoFormScreen';
import type { StockStackParamList } from './types';
import AccountButton from '../components/AccountButton';
import SelecaoEstoqueScreen from '../screens/setores/SelecaoEstoqueScreen';
import { appHeaderOptions } from '../theme/navigation';

const Stack = createStackNavigator<StockStackParamList>();

export default function StockNavigator() {
  return (
    <Stack.Navigator initialRouteName="Setores" screenOptions={{ ...appHeaderOptions, headerRight: () => <AccountButton /> }}>
      <Stack.Screen name="Setores" component={SetoresScreen} options={{ title: 'Setores' }} />
      <Stack.Screen name="SelecaoEstoque" component={SelecaoEstoqueScreen} options={{ title: 'Selecionar' }} />
      <Stack.Screen
        name="SetorForm"
        component={SetorFormScreen}
        options={({ route }) => ({
          title: route.params?.setor ? 'Editar setor' : 'Novo setor',
        })}
      />
      <Stack.Screen name="Produtos" component={ProdutosScreen} options={{ title: 'Produtos' }} />
      <Stack.Screen
        name="ProdutoForm"
        component={ProdutoFormScreen}
        options={({ route }) => ({ title: route.params.produto ? 'Editar produto' : 'Novo produto' })}
      />
      <Stack.Screen name="ProdutoDetalhes" component={ProdutoDetalhesScreen} options={{ title: 'Detalhes do produto' }} />
      <Stack.Screen name="MovimentacaoForm" component={MovimentacaoFormScreen}
        options={({ route }) => ({ title: route.params.movimentacao ? (route.params.tipo === 'entrada' ? 'Editar entrada' : 'Editar saída') : (route.params.tipo === 'entrada' ? 'Entrada de estoque' : 'Saída de estoque') })} />
    </Stack.Navigator>
  );
}
