/**
 * Color tokens for LinkDeck
 * Based on Atlassian Design System structure while maintaining LinkDeck's brand colors
 */

export const colors = {
  // Primary brand color (LinkDeck Blue)
  primary: '#007AFF',

  // Surface colors
  surface: {
    default: '#FFFFFF',
    raised: '#F9F9F9',
    overlay: 'rgba(0, 0, 0, 0.5)',
    sunken: '#F2F2F7',
  },

  // Background colors
  background: {
    default: '#F2F2F7',
    neutral: '#F9F9F9',
    subtle: '#FAFAFA',
  },

  // Border colors
  border: {
    default: '#E5E5EA',
    subtle: '#F0F0F0',
    focused: '#007AFF',
  },

  // Text colors
  text: {
    default: '#000000',
    subtle: '#8E8E93',
    subtlest: '#C7C7CC',
    inverse: '#FFFFFF',
    disabled: '#B0B0B0',
  },

  // Semantic colors
  semantic: {
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
    discovery: '#5856D6',
  },

  // Interactive states
  interactive: {
    default: '#007AFF',
    hovered: '#0051D5',
    pressed: '#003D99',
    disabled: '#B0B0B0',
  },

  // Secondary button colors
  secondary: {
    default: '#8E8E93',
    hovered: '#6D6D72',
    pressed: '#48484A',
  },
} as const;

export type Colors = typeof colors;
