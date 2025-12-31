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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTags, createTag, deleteTag } from '../../services/firestore';
import { Tag, TagsStackParamList } from '../../types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, CONFIRMATION_MESSAGES } from '../../constants/messages';
import { colors } from '../../theme';

interface Props {
  navigation: NativeStackNavigationProp<TagsStackParamList, 'TagsList'>;
}

const TagsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      if (__DEV__) {
        console.error('[Tags] Error loading tags:', error);
      }
      Alert.alert('エラー', ERROR_MESSAGES.TAGS.LOAD_FAILED);
    } finally{
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTags();
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
      Alert.alert('成功', SUCCESS_MESSAGES.TAGS.CREATED);
    } catch (error) {
      if (__DEV__) {
        console.error('[Tags] Error creating tag:', error);
      }
      Alert.alert('エラー', ERROR_MESSAGES.TAGS.CREATE_FAILED);
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
              Alert.alert('成功', SUCCESS_MESSAGES.TAGS.DELETED);
            } catch (error) {
              if (__DEV__) {
                console.error('[Tags] Error deleting tag:', error);
              }
              Alert.alert('エラー', ERROR_MESSAGES.TAGS.DELETE_FAILED);
            }
          },
        },
      ]
    );
  };

  const renderTagItem = ({ item }: { item: Tag }) => (
    <View style={styles.tagItemContainer}>
      <TouchableOpacity
        style={styles.tagItem}
        onPress={() => navigation.navigate('TagLinks', { tagName: item.name })}
      >
        <View style={styles.tagBadge}>
          <Text style={styles.tagName}>{item.name}</Text>
        </View>
        <Text style={styles.tagDate}>
          作成日: {item.createdAt.toLocaleDateString('ja-JP')}
        </Text>
        <Text style={styles.tapHint}>タップして関連リンクを表示</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTag(item)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.alert} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  createTagContainer: {
    backgroundColor: colors.white,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: colors.white,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  createButtonDisabled: {
    backgroundColor: colors.button.disabled,
  },
  createButtonText: {
    color: 'colors.white',
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
    color: colors.text.tertiary,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  listContent: {
    padding: 10,
  },
  tagItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tagItem: {
    flex: 1,
    padding: 15,
  },
  deleteButton: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  tagName: {
    color: 'colors.white',
    fontSize: 16,
    fontWeight: '600',
  },
  tagDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  tapHint: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default TagsScreen;
