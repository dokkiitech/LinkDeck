import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useApiKey } from '../../contexts/ApiKeyContext';
import { useDialog } from '../../contexts/DialogContext';
import { validateApiKey } from '../../services/gemini';

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const { hasApiKey, isLoading, saveApiKey, deleteApiKey } = useApiKey();
  const { showError, showSuccess, showConfirm } = useDialog();
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      showError('エラー', 'APIキーを入力してください');
      return;
    }

    setIsSaving(true);
    try {
      // APIキーの検証
      const isValid = await validateApiKey(geminiApiKey.trim());

      if (!isValid) {
        showError('エラー', 'APIキーが無効です。正しいキーを入力してください。');
        setIsSaving(false);
        return;
      }

      // Contextを使って保存（自動的にhasApiKeyが更新される）
      await saveApiKey(geminiApiKey.trim());
      setGeminiApiKey('');
      showSuccess('成功', 'APIキーを保存しました');
    } catch (error: any) {
      console.error('Error saving API key:', error);
      showError('エラー', error?.message || 'APIキーの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveApiKey = async () => {
    showConfirm(
      '確認',
      'APIキーを削除しますか？',
      async () => {
        try {
          // Contextを使って削除（自動的にhasApiKeyが更新される）
          await deleteApiKey();
          setGeminiApiKey('');
          showSuccess('成功', 'APIキーを削除しました');
        } catch (error) {
          showError('エラー', 'APIキーの削除に失敗しました');
        }
      }
    );
  };

  const handleOpenShortcut = async () => {
    const shortcutUrl = 'https://www.icloud.com/shortcuts/0dbc5884f700449485ef9f2bd6dfaa79';
    try {
      const supported = await Linking.canOpenURL(shortcutUrl);
      if (supported) {
        await Linking.openURL(shortcutUrl);
      } else {
        showError('エラー', 'ショートカットを開けませんでした');
      }
    } catch (error) {
      showError('エラー', 'ショートカットを開けませんでした');
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        showError('エラー', 'ログアウトに失敗しました');
      }
    };

    showConfirm('ログアウト', 'ログアウトしますか？', performLogout);
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
            <ActivityIndicator size="small" color="#007AFF" />
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
                  <ActivityIndicator color="#FFFFFF" />
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
              <Ionicons name="checkmark-circle" size={20} color="#34C759" style={styles.featureIcon} />
              <Text style={styles.featureText}>Safari、Chrome、その他のアプリから共有可能</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" style={styles.featureIcon} />
              <Text style={styles.featureText}>URLとページタイトルを自動取得</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" style={styles.featureIcon} />
              <Text style={styles.featureText}>ワンタップでLinksDeckに保存</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.shortcutButton]}
            onPress={handleOpenShortcut}
          >
            <Ionicons name="download-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
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
            <Ionicons name="archive-outline" size={24} color="#007AFF" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>アーカイブしたリンク</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
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
    backgroundColor: '#F2F2F7',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 15,
    lineHeight: 20,
  },
  infoContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  removeButton: {
    backgroundColor: '#FF9500',
    marginTop: 10,
  },
  upgradeButton: {
    backgroundColor: '#34C759',
    marginTop: 15,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
  },
  statusLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 10,
  },
  statusSuccess: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 10,
    fontStyle: 'italic',
  },
  shortcutButton: {
    backgroundColor: '#5856D6',
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
    color: '#000000',
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
    color: '#000000',
  },
});

export default SettingsScreen;
