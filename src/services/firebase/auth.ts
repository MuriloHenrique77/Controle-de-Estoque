import { getApp } from '@react-native-firebase/app';
import { getAuth, type Auth } from '@react-native-firebase/auth';

// A aplicação padrão é configurada nativamente; acesso somente quando solicitado.
export function obterAuth(): Auth {
  return getAuth(getApp());
}
