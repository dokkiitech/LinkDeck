import { useEffect, useState, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { createLink } from '../services/firestore';
import { fetchUrlTitle } from '../utils/urlMetadata';
import { extractURLFromText } from '../utils/urlValidation';

/**
 * URLスキーム経由で共有されたURLを処理するコンポーネント
 * linkdeck://share?url=...&title=... の形式で受け取る
 */
const SharedURLHandler: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useDialog();
  const isProcessingRef = useRef(false);
  const processedURLsRef = useRef<Set<string>>(new Set());
  const hasHandledInitialURL = useRef(false);

  useEffect(() => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      return;
    }

    // 初回起動時のURLを処理（1回だけ）
    const handleInitialURL = async () => {
      if (hasHandledInitialURL.current) {
        console.log('[SharedURLHandler] Initial URL already handled, skipping');
        return;
      }

      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('[SharedURLHandler] Processing initial URL:', initialUrl);
          hasHandledInitialURL.current = true;
          await processURL(initialUrl);
        }
      } catch (error) {
        console.error('[SharedURLHandler] Error handling initial URL:', error);
      }
    };

    handleInitialURL();

    // アプリがフォアグラウンドにある時のURL受信を監視
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [user]);

  const handleDeepLink = (event: { url: string }) => {
    console.log('[SharedURLHandler] Deep link event received:', event.url);

    // === ロック機構による排他制御 ===
    // 既に処理中なら即座にブロック（ショートカットが2回イベントを発火する対策）
    if (isProcessingRef.current) {
      console.log('[SharedURLHandler] Already processing, blocking duplicate event');
      return;
    }

    // ロック取得
    isProcessingRef.current = true;
    console.log('[SharedURLHandler] Lock acquired');

    // 処理実行
    processURL(event.url)
      .catch(error => {
        console.error('[SharedURLHandler] Error in processURL:', error);
      })
      .finally(() => {
        // ロック解放（必ず実行）
        isProcessingRef.current = false;
        console.log('[SharedURLHandler] Lock released');
      });
  };

  const processURL = async (url: string) => {
    // ユーザーがログインしていない場合は処理しない
    if (!user) {
      console.log('[SharedURLHandler] User not logged in, skipping');
      return;
    }

    // linkdeck:// スキームでない場合はスキップ
    if (!url.startsWith('linkdeck://')) {
      console.log('[SharedURLHandler] Not a linkdeck:// URL, skipping');
      return;
    }

    // URLをパース
    let parsed;
    try {
      parsed = Linking.parse(url);
    } catch (error) {
      console.error('[SharedURLHandler] Failed to parse URL:', error);
      return;
    }

    // linkdeck://share?url=...&title=... の形式をチェック
    if (parsed.hostname !== 'share') {
      console.log('[SharedURLHandler] Not a share URL, skipping');
      return;
    }

    const queryParams = parsed.queryParams as { url?: string; title?: string };
    const sharedText = queryParams.url;

    if (!sharedText || typeof sharedText !== 'string') {
      console.warn('[SharedURLHandler] Invalid shared URL');
      return;
    }

    // テキストからURLを抽出
    const extractedURL = extractURLFromText(sharedText);

    if (!extractedURL) {
      console.warn('[SharedURLHandler] No valid URL found');
      Alert.alert(
        'エラー',
        '共有されたテキストから有効なURLが見つかりませんでした。'
      );
      return;
    }

    console.log('[SharedURLHandler] Extracted URL:', extractedURL);

    // === シンプルな重複防止ロジック ===
    // 同じURLが処理中または直近5秒以内に処理済みならスキップ
    const now = Date.now();

    // 古いエントリをクリーンアップ（5秒以上前のものを削除）
    processedURLsRef.current.forEach(key => {
      const timestamp = parseInt(key.split('-').pop() || '0');
      if (now - timestamp > 5000) {
        processedURLsRef.current.delete(key);
      }
    });

    // 既に処理中または処理済みかチェック
    const isDuplicate = Array.from(processedURLsRef.current).some(key =>
      key.startsWith(`${extractedURL}-`)
    );

    if (isDuplicate) {
      console.log('[SharedURLHandler] Duplicate URL detected, skipping');
      return;
    }

    // URLを処理リストに追加
    const urlKey = `${extractedURL}-${now}`;
    processedURLsRef.current.add(urlKey);
    console.log('[SharedURLHandler] Processing:', extractedURL);

    try {
      // タイトル取得
      let title = queryParams.title && typeof queryParams.title === 'string'
        ? queryParams.title
        : undefined;

      if (!title) {
        try {
          const fetchedTitle = await fetchUrlTitle(extractedURL);
          title = fetchedTitle || extractedURL;
        } catch (error) {
          console.warn('[SharedURLHandler] Failed to fetch title, using URL');
          title = extractedURL;
        }
      }

      // Firestoreに保存
      await createLink(
        user.uid,
        extractedURL,
        title,
        [] // tags
      );

      console.log('[SharedURLHandler] Successfully saved:', extractedURL);

      Alert.alert(
        '共有URLを追加しました',
        `リンク「${title}」を保存しました`
      );
    } catch (error) {
      console.error('[SharedURLHandler] Error saving URL:', error);

      if (error instanceof Error) {
        console.error('[SharedURLHandler] Error:', error.message);
      }

      // エラー時は処理リストから削除（再試行可能に）
      processedURLsRef.current.delete(urlKey);

      Alert.alert(
        'エラー',
        '共有URLの追加に失敗しました。もう一度お試しください。'
      );
    }
  };

  return null; // このコンポーネントはUIを持たない
};

export default SharedURLHandler;
