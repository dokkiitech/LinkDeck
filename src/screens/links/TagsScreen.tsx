import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,

  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { useTags } from '../../hooks/useTags';
import { Tag, TagsStackParamList } from '../../types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants/messages';

interface Props {
  navigation: NativeStackNavigationProp<TagsStackParamList, 'TagsList'>;
}

const TagsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { showError, showSuccess, showConfirm } = useDialog();
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // useTagsフックを使用してタグ管理
  const {
    tags,
    loading,
    refreshing,
    createTag: createNewTag,
    deleteTag: deleteTagById,
    refresh,
    refetch,
  } = useTags({ userId: user?.uid });

  // 画面がフォーカスされた時にタグを再取得
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleCreateTag = async () => {
    if (!user || !newTagName.trim()) {
      showError('エラー', 'タグ名を入力してください');
      return;
    }

    // タグ名の重複チェック
    if (tags.some((tag) => tag.name === newTagName.trim())) {
      showError('エラー', 'このタグは既に存在します');
      return;
    }

    setIsCreating(true);
    try {
      await createNewTag(newTagName.trim());
      setNewTagName('');
      showSuccess('成功', SUCCESS_MESSAGES.TAGS.CREATED);
    } catch (error) {
      if (__DEV__) {
        console.error('[Tags] Error creating tag:', error);
      }
      showError('エラー', ERROR_MESSAGES.TAGS.CREATE_FAILED);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    if (!user) return;

    showConfirm(
      '確認',
      `「${tag.name}」を削除しますか？\nこのタグを使用している全てのリンクからも削除されます。`,
      async () => {
        try {
          await deleteTagById(tag.id);
          showSuccess('成功', SUCCESS_MESSAGES.TAGS.DELETED);
        } catch (error) {
          if (__DEV__) {
            console.error('[Tags] Error deleting tag:', error);
          }
          showError('エラー', ERROR_MESSAGES.TAGS.DELETE_FAILED);
        }
      }
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
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
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
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>タグ</Text>
      </View>
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
          onRefresh={refresh}
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
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
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
  tagItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
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
