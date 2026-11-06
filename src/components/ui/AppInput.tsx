import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radii, spacing, touchTarget, typography } from '../../theme';
export function AppInput({ label, error, style, ...props }: TextInputProps & { label: string; error?: string }) {
  return <View style={styles.container}><Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.textSecondary} {...props} style={[styles.input, error && styles.invalid, props.editable === false && styles.disabled, style]} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({ container: { gap: spacing.sm }, label: { ...typography.label, color: colors.text },
  input: { ...typography.body, color: colors.text, backgroundColor: colors.surface, borderColor: colors.border,
    borderWidth: 1, borderRadius: radii.md, minHeight: touchTarget, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  disabled: { opacity: 0.55 }, invalid: { borderColor: colors.danger }, error: { ...typography.caption, color: colors.danger } });
