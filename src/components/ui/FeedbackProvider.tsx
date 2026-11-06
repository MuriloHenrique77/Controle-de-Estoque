import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, touchTarget, typography } from '../../theme';
const FeedbackContext = createContext<(message: string, tone?: 'success' | 'error') => void>(() => {});
export function FeedbackProvider({ children }: PropsWithChildren) {
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const insets = useSafeAreaInsets();
  const show = useCallback((message: string, tone: 'success' | 'error' = 'success') => setFeedback({ message, tone }), []);
  useEffect(() => { if (!feedback) return; const timer = setTimeout(() => setFeedback(null), 5000); return () => clearTimeout(timer); }, [feedback]);
  return <FeedbackContext.Provider value={show}>{children}
    {feedback ? <View style={[styles.toast, { backgroundColor: feedback.tone === 'error' ? colors.danger : colors.success }, { bottom: insets.bottom + touchTarget + spacing.xxl }]}>
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.message}>{feedback.tone === 'error' ? '!' : '✓'} {feedback.message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Fechar mensagem" style={styles.close} onPress={() => setFeedback(null)}>
        <Text style={styles.message}>×</Text></Pressable>
    </View> : null}</FeedbackContext.Provider>;
}
export const useFeedback = () => useContext(FeedbackContext);
const styles = StyleSheet.create({ toast: { position: 'absolute', left: spacing.xl, right: spacing.xl,
  backgroundColor: colors.success, borderRadius: radii.md, paddingLeft: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  message: { ...typography.body, color: colors.surface, flex: 1 }, close: { minWidth: touchTarget, minHeight: touchTarget, justifyContent: 'center', alignItems: 'center' } });
