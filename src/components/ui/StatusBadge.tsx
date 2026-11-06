import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';
export function StatusBadge({ label, tone }: { label: string; tone: 'warning' | 'danger' }) {
  return <View style={[styles.badge, { backgroundColor: tone === 'warning' ? colors.warningSoft : colors.dangerSoft }]}>
    <Text style={[styles.text, { color: colors[tone] }]}>{label}</Text></View>;
}
const styles = StyleSheet.create({ badge: { alignSelf: 'flex-start', borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  text: { ...typography.caption } });
