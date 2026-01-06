import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinksStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { createLink, createTag } from '../../services/firestore';
import { extractURLFromText } from '../../utils/urlValidation';
import { fetchUrlTitle } from '../../utils/urlMetadata';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants/messages';
import { URLInput } from '../../components/links/URLInput';
import { TitleInput } from '../../components/links/TitleInput';
import { TagSelector } from '../../components/links/TagSelector';
import { useTags } from '../../hooks/useTags';
import QRCodeScanner from '../../components/links/QRCodeScanner';
import NFCReader from '../../components/links/NFCReader';
import { colors, theme } from '../../theme';

type AddLinkScreenNavigationProp = NativeStackNavigationProp<
  LinksStackParamList,
  'AddLink'
>;

type AddLinkScreenRouteProp = RouteProp<LinksStackParamList, 'AddLink'>;

interface Props {
  navigation: AddLinkScreenNavigationProp;
  route: AddLinkScreenRouteProp;
}

const AddLinkScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { showError, showSuccess, showConfirm } = useDialog();
  const initialUrl = route.params?.initialUrl || '';
  const [inputText, setInputText] = useState(initialUrl);
  const [titleText, setTitleText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNFCReader, setShowNFCReader] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);

  // カスタムフックを使用してタグ管理
  const { tags: existingTags, createTag: createNewTag } = useTags({ userId: user?.uid });

  // initialUrlが変更されたら入力テキストを更新し、タイトルを取得
  useEffect(() => {
    if (route.params?.initialUrl) {
      setInputText(route.params.initialUrl);
      // タイトルが未入力の場合のみ自動取得
      if (!titleText) {
        fetchAndSetTitle(route.params.initialUrl);
      }
    }
  }, [route.params?.initialUrl]);

  // URLからタイトルを取得する関数
  const fetchAndSetTitle = async (url: string) => {
    // URLが有効かチェック
    const extractedUrl = extractURLFromText(url);
    if (!extractedUrl) {
      return;
    }

    setFetchingTitle(true);
    try {
      const title = await fetchUrlTitle(extractedUrl);
      if (title && !titleText) {
        // ユーザーがまだタイトルを入力していない場合のみ設定
        setTitleText(title);
      }
    } catch (error) {
      console.warn('[AddLink] Error fetching title:', error);
    } finally {
      setFetchingTitle(false);
    }
  };

  const handleAddLink = async () => {
    if (!user) {
      showError('エラー', ERROR_MESSAGES.AUTH.LOGIN_REQUIRED);
      return;
    }

    if (!inputText.trim()) {
      showError('エラー', ERROR_MESSAGES.LINKS.URL_REQUIRED);
      return;
    }

    setLoading(true);

    try {
      // テキストからURLを抽出
      const extractedUrl = extractURLFromText(inputText);

      if (!extractedUrl) {
        showError('エラー', ERROR_MESSAGES.LINKS.NO_VALID_URL);
        setLoading(false);
        return;
      }

      // Firestoreに保存（タイトルが空の場合はURLを使用）
      const finalTitle = titleText.trim() || extractedUrl;
      await createLink(user.uid, extractedUrl, finalTitle, selectedTags);

      // 入力フィールドをクリア
      setInputText('');
      setTitleText('');
      setSelectedTags([]);

      showSuccess('成功', SUCCESS_MESSAGES.LINKS.SAVED, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AddLink] Error adding link:', error);
      }
      showError('エラー', ERROR_MESSAGES.LINKS.SAVE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!user) {
      showError('エラー', ERROR_MESSAGES.AUTH.LOGIN_REQUIRED);
      return;
    }

    if (!newTagName.trim()) {
      return;
    }

    const tagName = newTagName.trim();

    // 選択中のタグに既に含まれているかチェック
    if (selectedTags.includes(tagName)) {
      showError('エラー', ERROR_MESSAGES.TAGS.ALREADY_ADDED);
      return;
    }

    try {
      // 既存のタグにも含まれていない場合のみFirestoreに作成
      const existingTag = existingTags.find((tag) => tag.name === tagName);

      if (!existingTag) {
        await createNewTag(tagName);
      }

      // 選択中のタグに追加
      setSelectedTags([...selectedTags, tagName]);
      setNewTagName('');
    } catch (error) {
      if (__DEV__) {
        console.error('[AddLink] Error creating tag:', error);
      }
      showError('エラー', ERROR_MESSAGES.TAGS.CREATE_FAILED);
    }
  };

  const handleSelectTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      // 既に追加されている場合は削除
      setSelectedTags(selectedTags.filter((tag) => tag !== tagName));
    } else {
      // 追加
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleQRCodeScanned = (url: string) => {
    setInputText(url);
  };

  const handleNFCScanned = (url: string) => {
    setInputText(url);
    // タイトルが未入力の場合は自動取得
    if (!titleText) {
      fetchAndSetTitle(url);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <URLInput
          value={inputText}
          onChangeText={setInputText}
          editable={!loading}
        />

        <View style={styles.scanButtonsSection}>
          <Text style={styles.scanButtonsLabel}>スキャン</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setShowNFCReader(true)}
              disabled={loading}
            >
              <Ionicons name="radio-outline" size={24} color={colors.primary} />
              <Text style={styles.scanButtonText}>NFC</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setShowQRScanner(true)}
              disabled={loading}
            >
              <Ionicons name="qr-code" size={24} color={colors.primary} />
              <Text style={styles.scanButtonText}>QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TitleInput
          value={titleText}
          onChangeText={setTitleText}
          editable={!loading}
          loading={fetchingTitle}
        />

        <TagSelector
          selectedTags={selectedTags}
          existingTags={existingTags}
          newTagName={newTagName}
          onNewTagChange={setNewTagName}
          onAddTag={handleAddTag}
          onSelectTag={handleSelectTag}
          onRemoveTag={handleRemoveTag}
          disabled={loading}
        />

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleAddLink}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>保存</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <QRCodeScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRCodeScanned}
      />

      <NFCReader
        visible={showNFCReader}
        onClose={() => setShowNFCReader(false)}
        onScan={handleNFCScanned}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  scanButtonsSection: {
    marginBottom: 25,
  },
  scanButtonsLabel: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 15,
  },
  scanButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGray,
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: colors.button.disabled,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
  },
});

export default AddLinkScreen;
