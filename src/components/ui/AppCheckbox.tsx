import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, touchTarget, typography } from '../../theme';

export function AppCheckbox({ label, checked, disabled = false, onChange }: {
  label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void;
}) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label}
    accessibilityState={{ checked, disabled }} disabled={disabled} onPress={() => onChange(!checked)}
    style={[styles.row, disabled && styles.disabled]}>
    <View><Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} /></View>
    <Text style={styles.label}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', minHeight: touchTarget,
  gap: spacing.md, marginVertical: spacing.sm }, label: { ...typography.label, color: colors.text, flex: 1 }, disabled: { opacity: 0.55 } });
