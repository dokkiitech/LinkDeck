/**
 * Button component based on Atlassian Design System principles
 * Maintains LinkDeck's brand colors while providing consistent button patterns
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, semanticSpacing, textStyles } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    fullWidth && styles.fullWidth,
    styles[variant],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.inverse} />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: semanticSpacing.buttonHeight,
    paddingHorizontal: semanticSpacing.buttonPadding,
    borderRadius: semanticSpacing.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: textStyles.button.fontSize,
    fontWeight: textStyles.button.fontWeight,
    lineHeight: textStyles.button.lineHeight,
  },

  // Variant styles
  primary: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.text.inverse,
  },

  secondary: {
    backgroundColor: colors.secondary.default,
  },
  secondaryText: {
    color: colors.text.inverse,
  },

  success: {
    backgroundColor: colors.semantic.success,
  },
  successText: {
    color: colors.text.inverse,
  },

  danger: {
    backgroundColor: colors.semantic.danger,
  },
  dangerText: {
    color: colors.text.inverse,
  },

  warning: {
    backgroundColor: colors.semantic.warning,
  },
  warningText: {
    color: colors.text.inverse,
  },

  // Disabled state
  disabled: {
    backgroundColor: colors.interactive.disabled,
  },
  disabledText: {
    color: colors.text.inverse,
  },
});
