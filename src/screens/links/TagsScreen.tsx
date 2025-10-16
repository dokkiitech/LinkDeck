import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTags, createTag, deleteTag } from '../../services/firestore';
import { Tag, TagsStackParamList } from '../../types';

interface Props {
  navigation: NativeStackNavigationProp<TagsStackParamList, 'TagsList'>;
}

const TagsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTags();
  }, [user]);

  const loadTags = async () => {
    if (!user) return;

    try {
      const fetchedTags = await getUserTags(user.uid);
      setTags(fetchedTags);
    } catch (error) {
      console.error('Error loading tags:', error);
      Alert.alert('エラー', 'タグの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!user || !newTagName.trim()) {
      Alert.alert('エラー', 'タグ名を入力してください');
      return;
    }

    // タグ名の重複チェック
    if (tags.some((tag) => tag.name === newTagName.trim())) {
      Alert.alert('エラー', 'このタグは既に存在します');
      return;
    }

    setIsCreating(true);
    try {
      const tagId = await createTag(user.uid, newTagName.trim());
      const newTag: Tag = {
        id: tagId,
        userId: user.uid,
        name: newTagName.trim(),
        createdAt: new Date(),
      };
      setTags([newTag, ...tags]);
      setNewTagName('');
      Alert.alert('成功', 'タグを作成しました');
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('エラー', 'タグの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    if (!user) return;

    Alert.alert(
      '確認',
      `「${tag.name}」を削除しますか？\nこのタグを使用している全てのリンクからも削除されます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTag(user.uid, tag.id);
              setTags(tags.filter((t) => t.id !== tag.id));
              Alert.alert('成功', 'タグを削除しました');
            } catch (error) {
              console.error('Error deleting tag:', error);
              Alert.alert('エラー', 'タグの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderTagItem = ({ item }: { item: Tag }) => (
    <TouchableOpacity
      style={styles.tagItem}
      onPress={() => navigation.navigate('TagLinks', { tagName: item.name })}
      onLongPress={() => handleDeleteTag(item)}
    >
      <View style={styles.tagBadge}>
        <Text style={styles.tagName}>{item.name}</Text>
      </View>
      <Text style={styles.tagDate}>
        作成日: {item.createdAt.toLocaleDateString('ja-JP')}
      </Text>
      <Text style={styles.tapHint}>タップして関連リンクを表示</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.createTagContainer}>
        <TextInput
          style={styles.input}
          placeholder="新しいタグ名"
          value={newTagName}
          onChangeText={setNewTagName}
          editable={!isCreating}
        />
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreateTag}
          disabled={isCreating}
        >
          <Text style={styles.createButtonText}>
            {isCreating ? '作成中...' : '作成'}
          </Text>
        </TouchableOpacity>
      </View>

      {tags.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>タグがまだありません</Text>
          <Text style={styles.emptySubtext}>
            上のフォームから新しいタグを作成しましょう
          </Text>
        </View>
      ) : (
        <FlatList
          data={tags}
          renderItem={renderTagItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  createTagContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#F9F9F9',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  createButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  listContent: {
    padding: 10,
  },
  tagItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tagBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  tagName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tagDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tapHint: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default TagsScreen;
