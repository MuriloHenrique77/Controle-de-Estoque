import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, spacing, touchTarget, typography } from '../../theme';
type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'text';
export function AppButton({ label, onPress, variant = 'primary', disabled = false, loading = false, selected, style }: {
  label: string; onPress: () => void; variant?: Variant; disabled?: boolean; loading?: boolean; selected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const blocked = disabled || loading;
  const foreground = variant === 'primary' || variant === 'danger' ? colors.surface : colors.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: blocked, busy: loading, selected }}
    disabled={blocked} onPress={onPress} style={({ pressed }) => [styles.button, styles[variant], style, (blocked || pressed) && styles.dim]}>
    {loading ? <ActivityIndicator color={foreground} /> : null}
    <Text style={[styles.label, { color: foreground }]}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ button: { minHeight: touchTarget, minWidth: touchTarget, borderRadius: radii.md,
  paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary }, secondary: { backgroundColor: colors.primarySoft },
  outline: { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1 },
  danger: { backgroundColor: colors.danger }, text: { backgroundColor: 'transparent' },
  dim: { opacity: 0.55 }, label: { ...typography.label, textAlign: 'center' } });
