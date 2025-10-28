import React, { useState } from 'react';
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
import { LinksStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { createLink, createTag } from '../../services/firestore';
import { extractURLFromText } from '../../utils/urlMetadata';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants/messages';
import { URLInput } from '../../components/links/URLInput';
import { TitleInput } from '../../components/links/TitleInput';
import { TagSelector } from '../../components/links/TagSelector';
import { useTags } from '../../hooks/useTags';

type AddLinkScreenNavigationProp = NativeStackNavigationProp<
  LinksStackParamList,
  'AddLink'
>;

interface Props {
  navigation: AddLinkScreenNavigationProp;
}

const AddLinkScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);

  // カスタムフックを使用してタグ管理
  const { tags: existingTags, createTag: createNewTag } = useTags({ userId: user?.uid });

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
