import { Pressable, Text, StyleSheet } from 'react-native';
import { useSession } from '../session/SessionProvider';
import { colors, spacing, touchTarget, typography } from '../theme';

export default function LogoutButton() {
  const { encerrarSessao } = useSession();
  return <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={() => { void encerrarSessao(); }} style={styles.button}>
    <Text style={styles.text}>Sair</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ button: { minWidth: touchTarget, minHeight: touchTarget, paddingHorizontal: spacing.lg,
  alignItems: 'center', justifyContent: 'center' }, text: { ...typography.label, color: colors.primary } });
