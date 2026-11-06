import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import CadastroScreen from '../screens/auth/CadastroScreen';
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';

export type AuthStackParamList = { Welcome: undefined; Login: undefined; Cadastro: undefined; RecuperarSenha: undefined };
const Stack = createStackNavigator<AuthStackParamList>();
export default function AuthNavigator() {
  return <Stack.Navigator initialRouteName="Welcome">
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Entrar' }} />
    <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ title: 'Criar conta' }} />
    <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} options={{ title: 'Recuperar senha' }} />
  </Stack.Navigator>;
}
