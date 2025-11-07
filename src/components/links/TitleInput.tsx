import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, semanticSpacing, textStyles } from '../../theme/tokens';

interface TitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
  placeholder?: string;
  loading?: boolean;
}

/**
 * タイトル入力コンポーネント
 * リンク追加/編集画面で使用するタイトル入力フィールド
 */
export const TitleInput: React.FC<TitleInputProps> = ({
  value,
  onChangeText,
  editable = true,
  placeholder = 'タイトル（任意・未入力の場合は自動取得）',
  loading = false,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>タイトル</Text>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>取得中...</Text>
          </View>
        )}
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        editable={editable && !loading}
      />
      <Text style={styles.hint}>
        ※ 空欄の場合、URLからタイトルを自動取得します
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: semanticSpacing.sectionGap,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.space100,
  },
  label: {
    fontSize: textStyles.body.fontSize,
    fontWeight: textStyles.labelBold.fontWeight,
    color: colors.text.default,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.space100,
  },
  loadingText: {
    fontSize: textStyles.caption.fontSize,
    color: colors.primary,
    marginLeft: spacing.space50,
  },
  input: {
    backgroundColor: colors.surface.default,
    borderRadius: spacing.space100,
    padding: spacing.space150,
    fontSize: textStyles.body.fontSize,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: semanticSpacing.inputHeight,
  },
  hint: {
    fontSize: textStyles.caption.fontSize,
    color: colors.text.subtle,
    marginTop: spacing.space50,
  },
});
