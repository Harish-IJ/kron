export const colors = {
  base:   '#F4F1EB',
  ink:    '#1A1A1A',
  navy:   '#1A3B5C',
  orange: '#EA4313',
  teal:   '#2B6B6B',
  empty:  '#E5E2DC',
} as const;

export const fonts = {
  sans: 'Inter-Bold',
  sansBold: 'Inter-Bold',
  sansBlack: 'Inter-Black',
  mono: 'JetBrainsMono-Regular',
} as const;

export const space = {
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 32,
  9: 48,
} as const;

export const shadows = {
  card: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export const borders = {
  card:    { borderWidth: 2, borderColor: '#1A1A1A' },
  divider: { borderWidth: 1, borderColor: '#1A1A1A' },
  accent:  { borderWidth: 1, borderColor: '#EA4313' },
  active:  { borderWidth: 2, borderColor: '#EA4313' },
  navy:    { borderWidth: 2, borderColor: '#1A3B5C' },
} as const;

export const radii = {
  none: 0,
  pill: 9999,
} as const;
