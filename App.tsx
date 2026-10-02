import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Vendas from './src/screens/Vendas';
import SetoresScreen from './src/screens/setores/SetoresScreen';
import SetorFormScreen from './src/screens/setores/SetorFormScreen';
import ProdutosScreen from './src/screens/setores/ProdutosScreen';
import ProdutoFormScreen from './src/screens/setores/ProdutoFormScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function SetoresStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SetoresHome"
        component={SetoresScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SetorForm"
        component={SetorFormScreen}
        options={{ title: 'Novo setor' }}
      />
      <Stack.Screen
        name="Produtos"
        component={ProdutosScreen}
        options={{ title: 'Produtos' }}
      />
      <Stack.Screen
        name="ProdutoForm"
        component={ProdutoFormScreen}
        options={{ title: 'Novo produto' }}
      />
    </Stack.Navigator>
  );
}

function getDrawerHeaderVisible(route: any) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'SetoresHome';
  return routeName === 'SetoresHome';
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Drawer.Navigator>
          <Drawer.Screen
            name="Setores"
            component={SetoresStack}
            options={({ route }) => ({
              headerShown: getDrawerHeaderVisible(route),
            })}
          />
          <Drawer.Screen name="Vendas" component={Vendas} />
        </Drawer.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}