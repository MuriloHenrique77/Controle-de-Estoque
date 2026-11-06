import type { StackScreenProps } from '@react-navigation/stack';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AppButton } from '../../components/ui/AppButton';
import { colors, fonts, spacing } from '../../theme';

export default function WelcomeScreen({ navigation }: StackScreenProps<AuthStackParamList, 'Welcome'>) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // O PNG oficial já inclui margens transparentes: 288 dp exibe um símbolo de cerca de 160 dp.
  const logoSize = Math.min(288, width - insets.left - insets.right - spacing.xxl * 2);
  const needsScroll = height - insets.top - insets.bottom < 560 || fontScale > 1.3;
  const content = <>
    <View style={styles.logo}>
      <Image source={require('../../../assets/setority-adaptive-foreground.png')}
        resizeMode="contain" accessible={false} style={{ width: logoSize, height: logoSize }} />
    </View>
    <Text accessibilityRole="header" style={styles.title}>Setority</Text>
    <Text style={styles.subtitle}>Controle de estoque por setores</Text>
    <View style={styles.actions}>
      <AppButton label="Entrar" style={styles.button} onPress={() => navigation.navigate('Login')} />
      <AppButton label="Criar conta" variant="outline" style={styles.button} onPress={() => navigation.navigate('Cadastro')} />
    </View>
  </>;

  return <SafeAreaView style={styles.area}>
    {needsScroll ? <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView>
      : <View style={[styles.content, styles.fill]}>{content}</View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  area: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  logo: { height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 52, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sm },
  actions: { width: '100%', maxWidth: 440, gap: spacing.lg, marginTop: 36 },
  button: { minHeight: 52 },
});
