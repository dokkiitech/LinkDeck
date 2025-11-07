/**
 * Typography tokens for LinkDeck
 * Based on Atlassian Design System typography principles
 */

export const typography = {
  // Font families
  fontFamily: {
    default: 'System',  // React Native uses system font by default
    heading: 'System',
    code: 'Menlo',      // Monospace for code/technical content
  },

  // Font sizes (in pixels)
  fontSize: {
    h1: 32,      // Main titles
    h2: 24,      // Sub titles
    h3: 20,      // Section titles
    body: 16,    // Standard body text, buttons, inputs
    label: 14,   // Labels, descriptions
    caption: 12, // Hints, supplementary text
    small: 11,   // Very small text
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights (multipliers)
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Semantic typography styles for common use cases
export const textStyles = {
  h1: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.h1 * typography.lineHeight.tight,
  },
  h2: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.h3 * typography.lineHeight.normal,
  },
  body: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  bodyBold: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  label: {
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.label * typography.lineHeight.normal,
  },
  labelBold: {
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.label * typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.caption * typography.lineHeight.normal,
  },
  button: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.body * typography.lineHeight.tight,
  },
} as const;

export type Typography = typeof typography;
export type TextStyles = typeof textStyles;
