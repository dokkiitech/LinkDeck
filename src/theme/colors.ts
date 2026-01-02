/**
 * Color palette for LinkDeck application
 * Centralized color definitions for consistent theming
 */

export const colors = {
  // Background
  background: '#EEF4FF',

  // Primary
  primary: '#679EDE',

  // Accents
  accent1: '#90F395',
  accent2: '#EFAB58',

  // Alert
  alert: '#EF6458',

  // Neutrals
  black: '#16212D',
  gray: '#656565',

  // Additional UI colors (derived or supporting colors)
  white: '#FFFFFF',

  // Grays for different UI states
  lightGray: '#F2F2F7',
  mediumGray: '#8E8E93',
  borderGray: '#E5E5EA',

  // Status colors
  success: '#90F395', // Using accent1
  warning: '#EFAB58', // Using accent2
  error: '#EF6458',   // Using alert

  // Text colors
  text: {
    primary: '#16212D',    // black
    secondary: '#656565',  // gray
    tertiary: '#8E8E93',   // mediumGray
    inverse: '#FFFFFF',    // white
  },

  // Button colors
  button: {
    primary: '#679EDE',
    primaryText: '#FFFFFF',
    secondary: '#EEF4FF',
    secondaryText: '#16212D',
    disabled: '#B0B0B0',
    disabledText: '#656565',
  },

  // Link/Navigation colors
  link: '#679EDE',
  linkPressed: '#5181B8',

  // Overlay/Modal
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type Colors = typeof colors;
