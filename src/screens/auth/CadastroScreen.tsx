import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import CredenciaisScreen from './CredenciaisScreen';

export default function CadastroScreen({ navigation }: StackScreenProps<AuthStackParamList, 'Cadastro'>) {
  return <CredenciaisScreen cadastro alternar={() => navigation.navigate('Login')} />;
}
