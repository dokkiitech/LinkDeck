/**
 * Card component based on Atlassian Design System principles
 * Provides consistent card/surface patterns across the app
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, semanticSpacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  raised?: boolean;
  padding?: keyof typeof spacing;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  raised = false,
  padding = 'space250',
  style,
}) => {
  const cardStyle = [
    styles.card,
    raised && styles.raised,
    { padding: spacing[padding] },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderRadius: semanticSpacing.radiusMedium,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  raised: {
    shadowColor: colors.text.default,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
