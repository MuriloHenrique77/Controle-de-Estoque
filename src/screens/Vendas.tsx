import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NewVenda from './NewVenda';
import Relatorio from './Relatorio';
import { Ionicons } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';
import QuantidadeDetalhe from './QuantidadeDetalhe';

const Tabs = createBottomTabNavigator();
const Stack = createStackNavigator();

function RelatorioStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RelatorioHome"
        component={Relatorio}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuantidadeDetalhe"
        component={QuantidadeDetalhe}
        options={{ title: 'Quantidade por produto' }}
      />
    </Stack.Navigator>
  );
}

export default function Vendas() {
  return (
      <Tabs.Navigator>
        <Tabs.Screen name="Nova Venda" component={NewVenda}
        options={{ 
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="cart-outline" color={color} size={size} />
        ),
      }} /> 
        <Tabs.Screen name="Relatórios" component={RelatorioStack} 
        options={{ 
        headerShown: false, 
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="bar-chart-outline" color={color} size={size} />
        ),  
        }} />

      </Tabs.Navigator>

  );
}
 