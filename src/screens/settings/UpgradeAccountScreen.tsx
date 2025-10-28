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
    console.log('handleUpgrade called');
    console.log('displayName:', displayName);
    console.log('email:', email);
    console.log('password length:', password.length);
    console.log('confirmPassword length:', confirmPassword.length);

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

    console.log('Starting account upgrade...');
    setLoading(true);
    try {
      console.log('Calling linkGuestToAccount...');
      await linkGuestToAccount(email, password, displayName);
      console.log('Account upgrade successful');

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
      console.error('Account upgrade error:', error);
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
              <ActivityIndicator color="#FFFFFF" />
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
    backgroundColor: '#F2F2F7',
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
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#34C759',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 10,
  },
  infoBox: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 10,
    lineHeight: 20,
  },
});

export default UpgradeAccountScreen;
