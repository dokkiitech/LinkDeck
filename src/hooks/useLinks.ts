import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Link } from '../types';
import { getUserLinks, getLinksByTag } from '../services/firestore';
import { ERROR_MESSAGES } from '../constants/messages';

interface UseLinksOptions {
  userId: string | undefined;
  includeArchived?: boolean;
  tagName?: string;
}

interface UseLinksReturn {
  links: Link[];
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  refresh: () => void;
}

/**
 * リンク取得用カスタムフック
 * ユーザーのリンク一覧を取得し、状態管理を行う
 */
export const useLinks = ({
  userId,
  includeArchived = false,
  tagName,
}: UseLinksOptions): UseLinksReturn => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadLinks = useCallback(async (showLoading = true) => {
    if (!userId) return;

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      let fetchedLinks: Link[];

      if (tagName) {
        // タグでフィルタリング
        fetchedLinks = await getLinksByTag(userId, tagName);
      } else {
        // 全リンクまたはアーカイブ済みリンク
        fetchedLinks = await getUserLinks(userId, includeArchived);

        // アーカイブ済みのみの場合はフィルタリング
        if (includeArchived && tagName === undefined) {
          fetchedLinks = fetchedLinks.filter((link) => link.isArchived);
        }
      }

      setLinks(fetchedLinks);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(ERROR_MESSAGES.LINKS.LOAD_FAILED);
      setError(errorObj);

      if (__DEV__) {
        console.error('[useLinks] Error loading links:', err);
      }

      Alert.alert('エラー', ERROR_MESSAGES.LINKS.LOAD_FAILED);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, includeArchived, tagName]);

  const refetch = useCallback(async () => {
    await loadLinks(true);
  }, [loadLinks]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadLinks(false);
  }, [loadLinks]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  return {
    links,
    loading,
    refreshing,
    error,
    refetch,
    refresh,
  };
};
