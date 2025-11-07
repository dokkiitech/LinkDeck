import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ERROR_MESSAGES } from '../../constants/messages';
import { colors, spacing, semanticSpacing, textStyles } from '../../theme/tokens';

type UpgradeAccountScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'UpgradeAccount'>;

interface Props {
  navigation: UpgradeAccountScreenNavigationProp;
}

const UpgradeAccountScreen: React.FC<Props> = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { linkGuestToAccount } = useAuth();

  const handleUpgrade = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('エラー', 'すべてのフィールドを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      await linkGuestToAccount(email, password, displayName);

      // Web環境でも確実に動作するように、Alertの後すぐに戻る
      if (Platform.OS === 'web') {
        alert('アカウントが作成されました。これで、データを永続的に保存し、複数のデバイスからアクセスできます。');
        navigation.goBack();
      } else {
        Alert.alert(
          '成功',
          'アカウントが作成されました。これで、データを永続的に保存し、複数のデバイスからアクセスできます。',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[UpgradeAccount] Account upgrade error:', error);
      }
      if (Platform.OS === 'web') {
        alert('エラー: ' + error.message);
      } else {
        Alert.alert('エラー', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>アカウントを作成</Text>
          <Text style={styles.description}>
            ゲストアカウントを正規アカウントに変換します。
            保存したリンクやタグはそのまま引き継がれます。
          </Text>

          <TextInput
            style={styles.input}
            placeholder="表示名"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード（6文字以上）"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード（確認）"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.buttonText}>アカウントを作成</Text>
            )}
          </TouchableOpacity>

          {loading && (
            <Text style={styles.loadingText}>アカウント作成中...</Text>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>アカウント作成のメリット</Text>
            <Text style={styles.infoText}>✓ データの永続的な保存</Text>
            <Text style={styles.infoText}>✓ 複数デバイスからのアクセス</Text>
            <Text style={styles.infoText}>✓ アプリ削除後もデータを復元可能</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: semanticSpacing.screenPadding,
  },
  title: {
    fontSize: 28,
    fontWeight: textStyles.h1.fontWeight,
    color: colors.text.default,
    marginBottom: spacing.space150,
    marginTop: semanticSpacing.sectionGap,
  },
  description: {
    fontSize: textStyles.body.fontSize,
    color: colors.text.subtle,
    marginBottom: spacing.space400,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    height: semanticSpacing.inputHeight,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: semanticSpacing.radiusMedium,
    paddingHorizontal: spacing.space200,
    marginBottom: spacing.space200,
    fontSize: textStyles.body.fontSize,
    backgroundColor: colors.surface.default,
  },
  button: {
    width: '100%',
    height: semanticSpacing.buttonHeight,
    backgroundColor: colors.semantic.success,
    borderRadius: semanticSpacing.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.space150,
  },
  buttonDisabled: {
    backgroundColor: colors.interactive.disabled,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: textStyles.body.fontSize,
    fontWeight: textStyles.labelBold.fontWeight,
  },
  loadingText: {
    fontSize: textStyles.label.fontSize,
    color: colors.text.subtle,
    textAlign: 'center',
    marginTop: spacing.space150,
  },
  infoBox: {
    marginTop: spacing.space400,
    padding: semanticSpacing.screenPadding,
    backgroundColor: colors.surface.default,
    borderRadius: semanticSpacing.radiusMedium,
  },
  infoTitle: {
    fontSize: textStyles.h3.fontSize,
    fontWeight: textStyles.h3.fontWeight,
    color: colors.text.default,
    marginBottom: spacing.space200,
  },
  infoText: {
    fontSize: textStyles.label.fontSize,
    color: colors.text.subtle,
    marginBottom: spacing.space150,
    lineHeight: textStyles.label.lineHeight,
  },
});

export default UpgradeAccountScreen;
