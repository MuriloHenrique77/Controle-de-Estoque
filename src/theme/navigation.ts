import { DefaultTheme, type Theme } from '@react-navigation/native';
import { colors } from './colors';
import { fonts, typography } from './typography';
export const navigationTheme: Theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors,
  primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text,
  border: colors.border, notification: colors.danger }, fonts: {
  regular: { fontFamily: fonts.regular, fontWeight: 'normal' }, medium: { fontFamily: fonts.medium, fontWeight: 'normal' },
  bold: { fontFamily: fonts.semibold, fontWeight: 'normal' }, heavy: { fontFamily: fonts.bold, fontWeight: 'normal' },
} };
export const appHeaderOptions = { headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { ...typography.cardTitle, color: colors.text } };
