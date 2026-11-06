import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { AppButton } from './AppButton';
export function EmptyState({ title, message, action, onAction }: { title: string; message: string; action?: string; onAction?: () => void }) {
  return <View style={styles.box}><Text style={styles.title}>{title}</Text><Text style={styles.message}>{message}</Text>
    {action && onAction ? <AppButton variant="secondary" label={action} onPress={onAction} /> : null}</View>;
}
export function LoadingState() {
  return <View style={styles.box} accessibilityLabel="Carregando dados"><ActivityIndicator color={colors.primary} />
    <Text style={styles.message}>Carregando dados...</Text></View>;
}
export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <View style={styles.box}><Text accessibilityRole="alert" style={styles.error}>{message}</Text>
    <AppButton variant="secondary" label="Tentar novamente" onPress={retry} /></View>;
}
const styles = StyleSheet.create({ box: { paddingVertical: spacing.xxl, gap: spacing.md },
  title: { ...typography.cardTitle, color: colors.text }, message: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.body, color: colors.danger } });
