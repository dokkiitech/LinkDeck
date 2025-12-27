/**
 * Text component based on Atlassian Design System typography principles
 * Provides consistent text styles across the app
 */

import React from 'react';
import { Text as RNText, StyleSheet, TextProps as RNTextProps } from 'react-native';
import { colors, textStyles } from '../../theme/tokens';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodyBold' | 'label' | 'labelBold' | 'caption';
type TextColor = 'default' | 'subtle' | 'subtlest' | 'inverse' | 'disabled';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'default',
  style,
  children,
  ...props
}) => {
  const textStyle = [
    styles[variant],
    styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}` as keyof typeof styles],
    style,
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  // Variant styles
  h1: {
    fontSize: textStyles.h1.fontSize,
    fontWeight: textStyles.h1.fontWeight,
    lineHeight: textStyles.h1.lineHeight,
  },
  h2: {
    fontSize: textStyles.h2.fontSize,
    fontWeight: textStyles.h2.fontWeight,
    lineHeight: textStyles.h2.lineHeight,
  },
  h3: {
    fontSize: textStyles.h3.fontSize,
    fontWeight: textStyles.h3.fontWeight,
    lineHeight: textStyles.h3.lineHeight,
  },
  body: {
    fontSize: textStyles.body.fontSize,
    fontWeight: textStyles.body.fontWeight,
    lineHeight: textStyles.body.lineHeight,
  },
  bodyBold: {
    fontSize: textStyles.bodyBold.fontSize,
    fontWeight: textStyles.bodyBold.fontWeight,
    lineHeight: textStyles.bodyBold.lineHeight,
  },
  label: {
    fontSize: textStyles.label.fontSize,
    fontWeight: textStyles.label.fontWeight,
    lineHeight: textStyles.label.lineHeight,
  },
  labelBold: {
    fontSize: textStyles.labelBold.fontSize,
    fontWeight: textStyles.labelBold.fontWeight,
    lineHeight: textStyles.labelBold.lineHeight,
  },
  caption: {
    fontSize: textStyles.caption.fontSize,
    fontWeight: textStyles.caption.fontWeight,
    lineHeight: textStyles.caption.lineHeight,
  },

  // Color styles
  colorDefault: {
    color: colors.text.default,
  },
  colorSubtle: {
    color: colors.text.subtle,
  },
  colorSubtlest: {
    color: colors.text.subtlest,
  },
  colorInverse: {
    color: colors.text.inverse,
  },
  colorDisabled: {
    color: colors.text.disabled,
  },
});
