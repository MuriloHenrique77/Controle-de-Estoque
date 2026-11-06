import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={styles.box}><Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>;
}
const styles = StyleSheet.create({ box: { marginTop: spacing.xxl, marginBottom: spacing.md, gap: spacing.xs },
  title: { ...typography.cardTitle, color: colors.text }, subtitle: { ...typography.caption, color: colors.textSecondary } });
