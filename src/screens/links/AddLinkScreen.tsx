import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinksStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { createLink, createTag } from '../../services/firestore';
import { extractURLFromText } from '../../utils/urlValidation';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants/messages';
import { URLInput } from '../../components/links/URLInput';
import { TitleInput } from '../../components/links/TitleInput';
import { TagSelector } from '../../components/links/TagSelector';
import { useTags } from '../../hooks/useTags';
import QRCodeScanner from '../../components/links/QRCodeScanner';

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
  const initialUrl = route.params?.initialUrl || '';
  const [inputText, setInputText] = useState(initialUrl);
  const [titleText, setTitleText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // カスタムフックを使用してタグ管理
  const { tags: existingTags, createTag: createNewTag } = useTags({ userId: user?.uid });

  // initialUrlが変更されたら入力テキストを更新
  useEffect(() => {
    if (route.params?.initialUrl) {
      setInputText(route.params.initialUrl);
    }
  }, [route.params?.initialUrl]);

  const handleAddLink = async () => {
    if (!user) {
      Alert.alert('エラー', ERROR_MESSAGES.AUTH.LOGIN_REQUIRED);
      return;
    }

    if (!inputText.trim()) {
      Alert.alert('エラー', ERROR_MESSAGES.LINKS.URL_REQUIRED);
      return;
    }

    setLoading(true);

    try {
      // テキストからURLを抽出
      const extractedUrl = extractURLFromText(inputText);

      if (!extractedUrl) {
        Alert.alert('エラー', ERROR_MESSAGES.LINKS.NO_VALID_URL);
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

      Alert.alert('成功', SUCCESS_MESSAGES.LINKS.SAVED, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AddLink] Error adding link:', error);
      }
      Alert.alert('エラー', ERROR_MESSAGES.LINKS.SAVE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!user) {
      Alert.alert('エラー', ERROR_MESSAGES.AUTH.LOGIN_REQUIRED);
      return;
    }

    if (!newTagName.trim()) {
      return;
    }

    const tagName = newTagName.trim();

    // 選択中のタグに既に含まれているかチェック
    if (selectedTags.includes(tagName)) {
      Alert.alert('エラー', ERROR_MESSAGES.TAGS.ALREADY_ADDED);
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
      Alert.alert('エラー', ERROR_MESSAGES.TAGS.CREATE_FAILED);
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
        <View style={styles.urlSection}>
          <View style={styles.urlInputWrapper}>
            <URLInput
              value={inputText}
              onChangeText={setInputText}
              editable={!loading}
            />
          </View>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setShowQRScanner(true)}
            disabled={loading}
          >
            <Text style={styles.qrButtonText}>📷</Text>
            <Text style={styles.qrButtonLabel}>QR</Text>
          </TouchableOpacity>
        </View>

        <TitleInput
          value={titleText}
          onChangeText={setTitleText}
          editable={!loading}
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
            <ActivityIndicator color="#FFFFFF" />
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  urlSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    gap: 10,
  },
  urlInputWrapper: {
    flex: 1,
  },
  qrButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  qrButtonText: {
    fontSize: 24,
  },
  qrButtonLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddLinkScreen;
