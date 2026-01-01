import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { ERROR_MESSAGES } from '../../constants/messages';
import { colors, theme } from '../../theme';

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
  const { showError, showSuccess, showConfirm } = useDialog();

  const handleUpgrade = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      showError('エラー', 'すべてのフィールドを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      showError('エラー', 'パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      showError('エラー', 'パスワードは6文字以上で入力してください');
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
        showError('エラー', error.message);
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
              <ActivityIndicator color={colors.white} />
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
    backgroundColor: colors.lightGray,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: 10,
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    backgroundColor: colors.white,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.success,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: colors.button.disabled,
  },
  buttonText: {
    color: 'colors.white',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 10,
  },
  infoBox: {
    marginTop: 30,
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    marginBottom: 10,
    lineHeight: 20,
  },
});

export default UpgradeAccountScreen;
