import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, semanticSpacing, textStyles } from '../../theme/tokens';

interface URLInputProps {
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
}

/**
 * URL入力コンポーネント
 * リンク追加画面で使用するURL入力フィールド
 */
export const URLInput: React.FC<URLInputProps> = ({
  value,
  onChangeText,
  editable = true,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>URL</Text>
      <TextInput
        style={styles.input}
        placeholder="URLを入力"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        editable={editable}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: semanticSpacing.sectionGap,
  },
  label: {
    fontSize: textStyles.body.fontSize,
    fontWeight: textStyles.labelBold.fontWeight,
    color: colors.text.default,
    marginBottom: spacing.space100,
  },
  input: {
    backgroundColor: colors.surface.default,
    borderRadius: spacing.space100,
    padding: spacing.space150,
    fontSize: textStyles.body.fontSize,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
});
