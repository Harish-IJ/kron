export const COLORS = {
  // Base
  background: '#F8F9F9',
  surface: '#F8F9F9',
  surfaceContainerLow: '#F1F4F4',
  surfaceContainerHighest: '#FFFFFF',

  // Accent & Brand
  primary: '#45645E', // Sage
  primaryContainer: '#C7EAE1',
  primaryFixedDim: '#B9DCD3',

  // Tertiary / Missed / Corrective
  tertiary: '#8C4E3F', // Terracotta
  tertiaryContainer: '#FDAD9A',

  // Text & Borders
  onSurface: '#2C3435', // Never use pure black
  onSurfaceVariant: '#586162',
  outlineVariant: 'rgba(171, 180, 181, 0.15)', // 15% opacity ghost border
};

export const TYPOGRAPHY = {
  // Display scale
  displayLg: {
    fontFamily: 'Inter_700Bold',
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1,
  },
  displaySm: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },

  // Titles
  titleMd: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  titleSm: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Body
  bodyLg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Detail / Metadata
  labelSm: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5, // Explicitly tracked out
  },
  labelMd: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
};

export const SHADOWS = {
  // Ambient Shadow for floating elements, no hard drops
  floating: {
    shadowColor: COLORS.onSurface,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 4, // Android fallback
  },
};

export const RADII = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999, // Pill buttons
};
