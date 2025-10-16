import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinksStackParamList, Tag } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { createLink, getUserTags } from '../../services/firestore';
import { fetchURLMetadata, extractURLFromText } from '../../utils/urlMetadata';

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
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);

  useEffect(() => {
    loadExistingTags();
  }, [user]);

  const loadExistingTags = async () => {
    if (!user) return;
    try {
      const fetchedTags = await getUserTags(user.uid);
      setExistingTags(fetchedTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleAddLink = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインしてください');
      return;
    }

    if (!inputText.trim()) {
      Alert.alert('エラー', 'URLまたはテキストを入力してください');
      return;
    }

    setLoading(true);

    try {
      // テキストからURLを抽出
      const extractedUrl = extractURLFromText(inputText);

      if (!extractedUrl) {
        Alert.alert('エラー', '有効なURLが見つかりませんでした');
        setLoading(false);
        return;
      }

      // URLメタデータを取得
      const metadata = await fetchURLMetadata(extractedUrl);

      // Firestoreに保存
      await createLink(
        user.uid,
        extractedUrl,
        metadata.title,
        metadata.description,
        metadata.imageUrl,
        tags
      );

      Alert.alert('成功', 'リンクを保存しました', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error adding link:', error);
      Alert.alert('エラー', 'リンクの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) {
      return;
    }

    if (tags.includes(newTag.trim())) {
      Alert.alert('エラー', 'このタグは既に追加されています');
      return;
    }

    setTags([...tags, newTag.trim()]);
    setNewTag('');
  };

  const handleSelectExistingTag = (tagName: string) => {
    if (tags.includes(tagName)) {
      // 既に追加されている場合は削除
      setTags(tags.filter((tag) => tag !== tagName));
    } else {
      // 追加
      setTags([...tags, tagName]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>URLまたはテキスト</Text>
          <TextInput
            style={styles.input}
            placeholder="URLを入力、またはURLを含むテキストを貼り付け"
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
          <Text style={styles.hint}>
            ※ テキストに含まれるURLを自動で抽出します
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>タグ</Text>

          {existingTags.length > 0 && (
            <>
              <Text style={styles.subLabel}>既存のタグから選択</Text>
              <View style={styles.existingTagsContainer}>
                {existingTags.map((tag) => {
                  const isSelected = tags.includes(tag.name);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.existingTag,
                        isSelected && styles.existingTagSelected,
                      ]}
                      onPress={() => handleSelectExistingTag(tag.name)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.existingTagText,
                          isSelected && styles.existingTagTextSelected,
                        ]}
                      >
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.subLabel}>新しいタグを追加</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="タグ名を入力"
              value={newTag}
              onChangeText={setNewTag}
              editable={!loading}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={handleAddTag}
              disabled={loading}
            >
              <Text style={styles.addTagButtonText}>追加</Text>
            </TouchableOpacity>
          </View>

          {tags.length > 0 && (
            <>
              <Text style={styles.subLabel}>選択中のタグ</Text>
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tag}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Text style={styles.tagRemove}> ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

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
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 15,
    marginBottom: 8,
  },
  existingTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  existingTag: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  existingTagSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  existingTagText: {
    fontSize: 14,
    color: '#000000',
  },
  existingTagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 5,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 10,
  },
  addTagButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  addTagButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  tag: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  tagRemove: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
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
