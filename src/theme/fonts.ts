/**
 * Font configuration for LinkDeck application
 * Uses IBM Plex Mono as the primary font family
 */

import {
  useFonts,
  IBMPlexMono_400Regular,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';

export { useFonts, IBMPlexMono_400Regular, IBMPlexMono_700Bold };

export const fonts = {
  regular: 'IBMPlexMono_400Regular',
  bold: 'IBMPlexMono_700Bold',
} as const;

export type Fonts = typeof fonts;
