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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { saveGeminiApiKey, getGeminiApiKey, removeGeminiApiKey } from '../../utils/storage';
import { validateApiKey } from '../../services/gemini';

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

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント情報</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>表示名</Text>
          <Text style={styles.value}>{user?.displayName || '未設定'}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>メールアドレス</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
      </View>

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
