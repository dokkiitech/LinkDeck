import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

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
  },
});
