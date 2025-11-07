/**
 * Input component based on Atlassian Design System principles
 * Provides consistent text input patterns across the app
 */

import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, spacing, semanticSpacing, textStyles } from '../../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const inputStyle = [
    styles.input,
    isFocused && styles.inputFocused,
    error && styles.inputError,
    style,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={inputStyle}
        placeholderTextColor={colors.text.subtle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...textInputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: textStyles.label.fontSize,
    fontWeight: textStyles.label.fontWeight,
    color: colors.text.default,
    marginBottom: spacing.space100,
  },
  input: {
    height: semanticSpacing.inputHeight,
    paddingHorizontal: semanticSpacing.inputPadding,
    backgroundColor: colors.surface.raised,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: semanticSpacing.radiusMedium,
    fontSize: textStyles.body.fontSize,
    color: colors.text.default,
  },
  inputFocused: {
    borderColor: colors.border.focused,
    backgroundColor: colors.surface.default,
  },
  inputError: {
    borderColor: colors.semantic.danger,
  },
  errorText: {
    fontSize: textStyles.caption.fontSize,
    color: colors.semantic.danger,
    marginTop: spacing.space50,
  },
});
