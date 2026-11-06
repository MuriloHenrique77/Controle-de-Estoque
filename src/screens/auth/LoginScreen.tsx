import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import CredenciaisScreen from './CredenciaisScreen';

export default function LoginScreen({ navigation }: StackScreenProps<AuthStackParamList, 'Login'>) {
  return <CredenciaisScreen cadastro={false} alternar={() => navigation.navigate('Cadastro')}
    recuperar={() => navigation.navigate('RecuperarSenha')} />;
}
