/**
 * Spacing tokens for LinkDeck
 * Based on Atlassian Design System's 8px base scale
 * Values are in pixels for React Native
 */

export const spacing = {
  // Base spacing scale (8px increments)
  space0: 0,
  space25: 2,    // 0.25 * 8px
  space50: 4,    // 0.5 * 8px
  space75: 6,    // 0.75 * 8px
  space100: 8,   // 1 * 8px
  space150: 12,  // 1.5 * 8px
  space200: 16,  // 2 * 8px
  space250: 20,  // 2.5 * 8px
  space300: 24,  // 3 * 8px
  space400: 32,  // 4 * 8px
  space500: 40,  // 5 * 8px
  space600: 48,  // 6 * 8px
  space800: 64,  // 8 * 8px
  space1000: 80, // 10 * 8px

  // Negative spacing (for overlaps)
  spaceNegative25: -2,
  spaceNegative50: -4,
  spaceNegative75: -6,
  spaceNegative100: -8,
  spaceNegative150: -12,
  spaceNegative200: -16,
  spaceNegative250: -20,
  spaceNegative300: -24,
  spaceNegative400: -32,
} as const;

// Semantic spacing aliases for common use cases
export const semanticSpacing = {
  // Component internal padding
  inputPadding: spacing.space200,      // 16px
  buttonPadding: spacing.space200,     // 16px
  cardPadding: spacing.space250,       // 20px

  // Margins between elements
  elementGap: spacing.space150,        // 12px
  sectionGap: spacing.space250,        // 20px
  screenPadding: spacing.space250,     // 20px

  // Component dimensions
  inputHeight: 50,                     // Standard input field height
  buttonHeight: 50,                    // Standard button height

  // Border radius
  radiusSmall: spacing.space100,       // 8px
  radiusMedium: spacing.space150,      // 12px
  radiusLarge: spacing.space200,       // 16px
  radiusRound: spacing.space250,       // 20px
} as const;

export type Spacing = typeof spacing;
export type SemanticSpacing = typeof semanticSpacing;
