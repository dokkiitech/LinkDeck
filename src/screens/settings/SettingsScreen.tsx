import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { saveGeminiApiKey, getGeminiApiKey, removeGeminiApiKey } from '../../utils/storage';
import { validateApiKey } from '../../services/gemini';
import { colors, theme } from '../../theme';

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const savedKey = await getGeminiApiKey();
      if (savedKey) {
        setHasApiKey(true);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      Alert.alert('エラー', 'APIキーを入力してください');
      return;
    }

    setIsSaving(true);
    try {
      // APIキーの検証
      const isValid = await validateApiKey(geminiApiKey.trim());

      if (!isValid) {
        Alert.alert('エラー', 'APIキーが無効です。正しいキーを入力してください。');
        setIsSaving(false);
        return;
      }

      // AsyncStorageに保存
      await saveGeminiApiKey(geminiApiKey.trim());
      setHasApiKey(true);
      setGeminiApiKey('');
      Alert.alert('成功', 'APIキーを保存しました');
    } catch (error: any) {
      console.error('Error saving API key:', error);
      Alert.alert('エラー', error.message || 'APIキーの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveApiKey = async () => {
    Alert.alert(
      '確認',
      'APIキーを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGeminiApiKey();
              setHasApiKey(false);
              setGeminiApiKey('');
              Alert.alert('成功', 'APIキーを削除しました');
            } catch (error) {
              Alert.alert('エラー', 'APIキーの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleOpenShortcut = async () => {
    const shortcutUrl = 'https://www.icloud.com/shortcuts/0dbc5884f700449485ef9f2bd6dfaa79';
    try {
      const supported = await Linking.canOpenURL(shortcutUrl);
      if (supported) {
        await Linking.openURL(shortcutUrl);
      } else {
        Alert.alert('エラー', 'ショートカットを開けませんでした');
      }
    } catch (error) {
      Alert.alert('エラー', 'ショートカットを開けませんでした');
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        Alert.alert('エラー', 'ログアウトに失敗しました');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('ログアウトしますか？')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'ログアウト',
        'ログアウトしますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'ログアウト',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント情報</Text>
        {user?.isAnonymous ? (
          <View>
            <View style={styles.infoContainer}>
              <Text style={styles.label}>アカウントタイプ</Text>
              <Text style={styles.value}>ゲストユーザー</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.upgradeButton]}
              onPress={() => (navigation as any).navigate('UpgradeAccount')}
            >
              <Text style={styles.buttonText}>アカウントを作成</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              ※ アカウントを作成すると、データを永続的に保存し、複数のデバイスからアクセスできます
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.infoContainer}>
              <Text style={styles.label}>表示名</Text>
              <Text style={styles.value}>{user?.displayName || '未設定'}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.label}>メールアドレス</Text>
              <Text style={styles.value}>{user?.email}</Text>
            </View>
          </View>
        )}
      </View>

      {Platform.OS !== 'web' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gemini API設定</Text>
          <Text style={styles.description}>
            AI要約機能を使用するには、Google AI Studioで取得したGemini APIキーを入力してください。
          </Text>

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : hasApiKey ? (
            <View>
              <View style={styles.statusContainer}>
                <Text style={styles.statusLabel}>状態:</Text>
                <Text style={styles.statusSuccess}>APIキー設定済み ✓</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.removeButton]}
                onPress={handleRemoveApiKey}
              >
                <Text style={styles.buttonText}>APIキーを削除</Text>
              </TouchableOpacity>
              <Text style={styles.hint}>
                ※ 新しいAPIキーを設定するには、まず既存のキーを削除してください
              </Text>
            </View>
          ) : (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Gemini APIキー"
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                secureTextEntry
                editable={!isSaving}
              />
              <TouchableOpacity
                style={[styles.button, isSaving && styles.buttonDisabled]}
                onPress={handleSaveApiKey}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>APIキーを保存</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {Platform.OS === 'ios' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>iOSショートカット</Text>
          <Text style={styles.description}>
            他のアプリからLinksDeckへURLを簡単に共有できるiOSショートカットをインストールできます。
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} style={styles.featureIcon} />
              <Text style={styles.featureText}>Safari、Chrome、その他のアプリから共有可能</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} style={styles.featureIcon} />
              <Text style={styles.featureText}>URLとページタイトルを自動取得</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} style={styles.featureIcon} />
              <Text style={styles.featureText}>ワンタップでLinksDeckに保存</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.shortcutButton]}
            onPress={handleOpenShortcut}
          >
            <Ionicons name="download-outline" size={20} color={colors.white} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>ショートカットをインストール</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            ※ iOSの「ショートカット」アプリが必要です。タップするとショートカットのダウンロードページが開きます。
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>リンク管理</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => (navigation as any).navigate('Links', { screen: 'ArchivedLinks' })}
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="archive-outline" size={24} color={colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>アーカイブしたリンク</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="colors.borderGray" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリについて</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>バージョン</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>ログアウト</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    marginBottom: 15,
    lineHeight: 20,
  },
  infoContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.primary,
    fontWeight: '500',
  },
  input: {
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
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.button.disabled,
  },
  removeButton: {
    backgroundColor: colors.warning,
    marginTop: 10,
  },
  upgradeButton: {
    backgroundColor: colors.success,
    marginTop: 15,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: 'colors.white',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    marginRight: 10,
  },
  statusSuccess: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.success,
    fontFamily: theme.typography.fontFamily.bold,
  },
  hint: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    marginTop: 10,
    fontStyle: 'italic',
  },
  shortcutButton: {
    backgroundColor: 'colors.accent2',
    flexDirection: 'row',
    marginBottom: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.primary,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.primary,
  },
});

export default SettingsScreen;
