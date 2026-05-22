export const colors = {
  // Green (primary)
  green50: '#f0faf4',
  green100: '#d8f3e3',
  green200: '#aee6c5',
  green500: '#4a9e72',
  green600: '#3d8760',
  green700: '#2f6849',
  green900: '#1a3d2a',

  // Coral (accent / warning)
  coral50: '#fff4f0',
  coral100: '#ffe5da',
  coral500: '#e07a5f',
  coral700: '#b85a42',

  // Honey (warm highlight)
  honey100: '#fef5e1',
  honey500: '#f2c94c',

  // Neutrals
  bg: '#faf8f2',
  surface: '#ffffff',
  surfaceAlt: '#f5f3ed',
  border: '#e8e4da',
  textPrimary: '#1a1a1a',
  textSecondary: '#6b6b6b',
  textMuted: '#9e9e9e',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textMuted },
};
