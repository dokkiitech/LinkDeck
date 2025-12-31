import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../theme';

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
            <ActivityIndicator size="small" color={colors.primary} />
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
    marginBottom: 25,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  loadingText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 5,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.borderGray,
    minHeight: 50,
  },
  hint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 5,
  },
});
