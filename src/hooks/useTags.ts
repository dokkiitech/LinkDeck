import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Tag } from '../types';
import { getUserTags, createTag as createTagService, deleteTag as deleteTagService } from '../services/firestore';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/messages';

interface UseTagsOptions {
  userId: string | undefined;
}

interface UseTagsReturn {
  tags: Tag[];
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  createTag: (tagName: string) => Promise<string>;
  deleteTag: (tagId: string) => Promise<void>;
  refetch: () => Promise<void>;
  refresh: () => void;
}

/**
 * タグ管理用カスタムフック
 * ユーザーのタグ一覧を取得し、CRUD操作を提供する
 */
export const useTags = ({ userId }: UseTagsOptions): UseTagsReturn => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadTags = useCallback(async (showLoading = true) => {
    if (!userId) return;

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const fetchedTags = await getUserTags(userId);
      setTags(fetchedTags);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(ERROR_MESSAGES.TAGS.LOAD_FAILED);
      setError(errorObj);

      if (__DEV__) {
        console.error('[useTags] Error loading tags:', err);
      }

      Alert.alert('エラー', ERROR_MESSAGES.TAGS.LOAD_FAILED);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  const createTag = useCallback(async (tagName: string): Promise<string> => {
    if (!userId) {
      throw new Error(ERROR_MESSAGES.AUTH.LOGIN_REQUIRED);
    }

    try {
      const tagId = await createTagService(userId, tagName);
      const newTag: Tag = {
        id: tagId,
        userId,
        name: tagName,
        createdAt: new Date(),
      };
      setTags((prevTags) => [newTag, ...prevTags]);
      return tagId;
    } catch (err) {
      if (__DEV__) {
        console.error('[useTags] Error creating tag:', err);
      }
      throw new Error(ERROR_MESSAGES.TAGS.CREATE_FAILED);
    }
  }, [userId]);

  const deleteTag = useCallback(async (tagId: string): Promise<void> => {
    if (!userId) {
      throw new Error(ERROR_MESSAGES.AUTH.LOGIN_REQUIRED);
    }

    try {
      await deleteTagService(userId, tagId);
      setTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId));
    } catch (err) {
      if (__DEV__) {
        console.error('[useTags] Error deleting tag:', err);
      }
      throw new Error(ERROR_MESSAGES.TAGS.DELETE_FAILED);
    }
  }, [userId]);

  const refetch = useCallback(async () => {
    await loadTags(true);
  }, [loadTags]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadTags(false);
  }, [loadTags]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return {
    tags,
    loading,
    refreshing,
    error,
    createTag,
    deleteTag,
    refetch,
    refresh,
  };
};
