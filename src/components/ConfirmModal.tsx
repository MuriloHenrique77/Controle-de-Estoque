import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { AppButton } from './ui/AppButton';

type ConfirmModalProps = {
  visible: boolean; busy?: boolean; destructive?: boolean; title: string; message: string;
  confirmText?: string; cancelText?: string; onConfirm: () => void; onCancel: () => void;
};
export default function ConfirmModal({ visible, busy = false, destructive = true, title, message,
  confirmText = 'Excluir', cancelText = 'Cancelar', onConfirm, onCancel }: ConfirmModalProps) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
    <View style={styles.overlay}>
      <ScrollView style={styles.modalCard} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <View style={styles.action}><AppButton label={cancelText} variant="secondary" disabled={busy} onPress={onCancel} /></View>
          <View style={styles.action}><AppButton label={confirmText} variant={destructive ? 'danger' : 'primary'} loading={busy} onPress={onConfirm} /></View>
        </View>
      </ScrollView>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  modalCard: { flexGrow: 0, width: '100%', maxWidth: 420, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radii.lg },
  content: { padding: spacing.xl }, title: { ...typography.cardTitle, color: colors.text, marginBottom: spacing.md },
  message: { ...typography.body, color: colors.textSecondary }, actions: { flexDirection: 'row', marginTop: spacing.xxl, gap: spacing.sm },
  action: { flex: 1 },
});
