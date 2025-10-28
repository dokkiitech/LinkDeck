import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface TitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
  placeholder?: string;
}

/**
 * タイトル入力コンポーネント
 * リンク追加/編集画面で使用するタイトル入力フィールド
 */
export const TitleInput: React.FC<TitleInputProps> = ({
  value,
  onChangeText,
  editable = true,
  placeholder = 'タイトル（任意・未入力の場合はURLを使用）',
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>タイトル</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
      />
      <Text style={styles.hint}>
        ※ 空欄の場合、URLがタイトルとして使用されます
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 50,
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 5,
  },
});
