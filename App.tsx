import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { SessionProvider } from './src/session/SessionProvider';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import BootScreen from './src/components/BootScreen';
import { navigationTheme } from './src/theme/navigation';
import { FeedbackProvider } from './src/components/ui/FeedbackProvider';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useRef } from 'react';

// A raiz persistente libera a splash, sem aguardar fontes, imagem ou sessão.
void SplashScreen.preventAutoHideAsync().catch(() => {
  console.warn('Não foi possível preparar a abertura nativa.');
});

export default function App() {
  const [fontesCarregadas, erroFonte] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const splashLiberada = useRef(false);
  const ocultarSplashNativa = useCallback(() => {
    if (splashLiberada.current) return;
    splashLiberada.current = true;
    void SplashScreen.hideAsync().catch(() => {
      splashLiberada.current = false;
      console.warn('Não foi possível concluir a abertura nativa.');
    });
  }, []);
  // Enquanto recursos locais ou sessão carregam, o React já pode mostrar o Boot.
  return (
    <SafeAreaProvider onLayout={ocultarSplashNativa}>
      <StatusBar style="dark" />
      {!fontesCarregadas ? <BootScreen erro={Boolean(erroFonte)} /> : (
      <FeedbackProvider>
      <SessionProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </SessionProvider>
      </FeedbackProvider>
      )}
    </SafeAreaProvider>
  );
}
