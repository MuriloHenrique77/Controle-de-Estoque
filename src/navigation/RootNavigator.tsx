import { createStackNavigator } from '@react-navigation/stack';
import { useSession } from '../session/SessionProvider';
import AuthNavigator from './AuthNavigator';
import AuthenticatedNavigator from './AuthenticatedNavigator';
import { appHeaderOptions } from '../theme/navigation';
import CriarEstabelecimentoScreen from '../screens/auth/CriarEstabelecimentoScreen';
import LoadingScreen from '../screens/auth/LoadingScreen';
import LogoutButton from '../components/LogoutButton';
import { AuthFormLayout, FormButton } from '../components/AuthFormLayout';
import ContaScreen from '../screens/conta/ContaScreen';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

function SessionErrorScreen() {
  const { estado, atualizarPerfil, encerrarSessao } = useSession();
  return <AuthFormLayout title="Não foi possível carregar sua sessão" subtitle="O acesso ao aplicativo permanece bloqueado. Verifique sua conexão e tente novamente."
    erro={estado.status === 'error' ? estado.mensagem : null}>
    <FormButton label="Tentar novamente" onPress={() => { void atualizarPerfil(); }} />
    <FormButton link label="Sair da conta" onPress={() => { void encerrarSessao(); }} />
  </AuthFormLayout>;
}

export default function RootNavigator() {
  const { estado } = useSession();
  const chave = estado.status === 'authenticatedReady'
    ? `${estado.status}:${estado.conta.uid}:${estado.perfil.estabelecimentoId}` : estado.status;
  return <Stack.Navigator key={chave} screenOptions={appHeaderOptions}>
    {estado.status === 'loading' ? <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
      : estado.status === 'unauthenticated' ? <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      : estado.status === 'authenticatedWithoutProfile' ? <Stack.Screen name="Onboarding" component={CriarEstabelecimentoScreen} options={{ title: 'Configurar estabelecimento', headerRight: () => <LogoutButton /> }} />
      : estado.status === 'authenticatedReady' ? <>
        <Stack.Screen name="Stock" component={AuthenticatedNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Conta" component={ContaScreen} options={{ title: 'Conta' }} />
      </>
      : <Stack.Screen name="Error" component={SessionErrorScreen} options={{ title: 'Sessão' }} />}
  </Stack.Navigator>;
}
