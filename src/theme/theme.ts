/**
 * Main theme configuration for LinkDeck application
 * Combines colors and typography settings
 */

import { colors } from './colors';

export const theme = {
  colors,

  // Typography
  typography: {
    fontFamily: {
      regular: 'IBMPlexSans_400Regular',
      bold: 'IBMPlexSans_700Bold',
    },

    // Font sizes
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },

    // Font weights (for reference, actual weights come from font files)
    fontWeight: {
      regular: '400' as const,
      bold: '700' as const,
    },
  },
} as const;

export type Theme = typeof theme;
