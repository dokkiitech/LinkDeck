/**
 * Font configuration for LinkDeck application
 * Uses IBM Plex Sans as the primary font family
 */

import {
  useFonts,
  IBMPlexSans_400Regular,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';

export { useFonts, IBMPlexSans_400Regular, IBMPlexSans_700Bold };

export const fonts = {
  regular: 'IBMPlexSans_400Regular',
  bold: 'IBMPlexSans_700Bold',
} as const;

export type Fonts = typeof fonts;
