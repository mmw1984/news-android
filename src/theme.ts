// Material 3 Expressive Design System
// Uses a deep teal primary with expressive secondary accents

export const Colors = {
  // Primary teal palette
  primary: '#006874',
  onPrimary: '#FFFFFF',
  primaryContainer: '#97F0FF',
  onPrimaryContainer: '#001F24',

  // Secondary violet accent
  secondary: '#4A6267',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CCE8ED',
  onSecondaryContainer: '#051F23',

  // Tertiary rose accent for AI features
  tertiary: '#525E7D',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#DAE2FF',
  onTertiaryContainer: '#0D1B37',

  // Surface
  background: '#FAFDFD',
  onBackground: '#191C1D',
  surface: '#FAFDFD',
  onSurface: '#191C1D',
  surfaceVariant: '#DBE4E6',
  onSurfaceVariant: '#3F484A',

  // Error
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  // Outline
  outline: '#6F797A',
  outlineVariant: '#BFC8CA',

  // Category badge colours
  categoryColors: {
    'hk-overseas': '#006874',
    'hk-local': '#7B5800',
    'international-mainstream': '#006E2C',
    'international-tech': '#8B418F',
  } as Record<string, string>,
};

// Dark mode palette
export const DarkColors = {
  primary: '#4FD8EB',
  onPrimary: '#00363D',
  primaryContainer: '#004F58',
  onPrimaryContainer: '#97F0FF',

  secondary: '#B0CBD0',
  onSecondary: '#1B3438',
  secondaryContainer: '#324B4F',
  onSecondaryContainer: '#CCE8ED',

  tertiary: '#BAC6EA',
  onTertiary: '#24304D',
  tertiaryContainer: '#3B4664',
  onTertiaryContainer: '#DAE2FF',

  background: '#191C1D',
  onBackground: '#E1E3E3',
  surface: '#191C1D',
  onSurface: '#E1E3E3',
  surfaceVariant: '#3F484A',
  onSurfaceVariant: '#BFC8CA',

  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  outline: '#899294',
  outlineVariant: '#3F484A',

  categoryColors: {
    'hk-overseas': '#4FD8EB',
    'hk-local': '#FBBC04',
    'international-mainstream': '#34A853',
    'international-tech': '#CE93D8',
  } as Record<string, string>,
};

export const Typography = {
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '400' as const },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '400' as const },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '400' as const },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '400' as const },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const, letterSpacing: 0.15 },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, letterSpacing: 0.1 },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, letterSpacing: 0.5 },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, letterSpacing: 0.25 },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0.4 },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.5 },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.5 },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 28,
  full: 9999,
};

export const Elevation = {
  level0: {},
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
};
