import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { AppButton } from './ui/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, touchTarget } from '../theme';

export const authStyles = StyleSheet.create({
  area: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.xl, paddingBottom: spacing.xxxl },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  input: { ...typography.body, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, marginBottom: spacing.lg, minHeight: touchTarget },
  error: { ...typography.body, color: colors.danger, marginBottom: spacing.lg },
});

export function AuthFormLayout({ title, subtitle, erro, children }: React.PropsWithChildren<{
  title: string; subtitle: string; erro?: string | null;
}>) {
  const headerHeight = useHeaderHeight();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => { if (erro) scroll.current?.scrollTo({ y: 0, animated: true }); }, [erro]);
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={authStyles.area}>
    <KeyboardAvoidingView style={authStyles.area} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}>
      <ScrollView ref={scroll} contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={authStyles.title}>{title}</Text>
        <Text style={authStyles.subtitle}>{subtitle}</Text>
        {erro ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={authStyles.error}>{erro}</Text> : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function FormButton({ label, onPress, disabled = false, link = false, loading = false, variant }: {
  label: string; onPress: () => void; disabled?: boolean; link?: boolean; loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
}) {
  return <View style={{ marginBottom: spacing.md }}><AppButton label={label} onPress={onPress}
    disabled={disabled} loading={loading} variant={variant ?? (link ? 'text' : 'primary')} /></View>;
}
