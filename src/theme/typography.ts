export const fonts = {
  regular: 'Inter_400Regular', medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold',
} as const;
export const typography = {
  title: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 32 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  number: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 36 },
} as const;
