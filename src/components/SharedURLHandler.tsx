import { useEffect, useState, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useShareIntent } from 'expo-share-intent';
import { useAuth } from '../contexts/AuthContext';
import { createLink } from '../services/firestore';
import { fetchUrlTitle } from '../utils/urlMetadata';
import { extractURLFromText } from '../utils/urlValidation';

/**
 * URLスキーム経由またはiOS/Android共有拡張機能で共有されたURLを処理するコンポーネント
 * - URLスキーム: linkdeck://share?url=...&title=... の形式
 * - iOS/Android共有拡張: expo-share-intentを使用
 */
const SharedURLHandler: React.FC = () => {
  const { user } = useAuth();
  const isProcessingRef = useRef(false);
  const processedURLsRef = useRef<Set<string>>(new Set());
  const hasHandledInitialURL = useRef(false);
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent();

  // 共有インテントの処理
  useEffect(() => {
    if (!user || !hasShareIntent || !shareIntent) {
      return;
    }

    console.log('[SharedURLHandler] Share intent received:', shareIntent);
    handleShareIntent(shareIntent);
  }, [user, hasShareIntent, shareIntent]);

  // 共有インテントエラーの処理
  useEffect(() => {
    if (error) {
      console.error('[SharedURLHandler] Share intent error:', error);
      Alert.alert('エラー', '共有データの取得に失敗しました。');
    }
  }, [error]);

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

  const handleShareIntent = async (intent: any) => {
    // === ロック機構による排他制御 ===
    if (isProcessingRef.current) {
      console.log('[SharedURLHandler] Already processing, blocking duplicate share event');
      return;
    }

    // ロック取得
    isProcessingRef.current = true;
    console.log('[SharedURLHandler] Lock acquired for share intent');

    try {
      await processShareIntent(intent);
    } catch (error) {
      console.error('[SharedURLHandler] Error in processShareIntent:', error);
    } finally {
      // ロック解放（必ず実行）
      isProcessingRef.current = false;
      console.log('[SharedURLHandler] Lock released');
      // 共有インテントをリセット
      resetShareIntent();
    }
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

  const processShareIntent = async (intent: any) => {
    // ユーザーがログインしていない場合は処理しない
    if (!user) {
      console.log('[SharedURLHandler] User not logged in, skipping share');
      return;
    }

    console.log('[SharedURLHandler] Processing share intent:', intent);

    // URLまたはテキストを抽出
    let sharedText = '';

    // webUrlが存在する場合はそれを使用
    if (intent.webUrl) {
      sharedText = intent.webUrl;
    }
    // textが存在する場合はそれを使用
    else if (intent.text) {
      sharedText = intent.text;
    }

    if (!sharedText) {
      console.warn('[SharedURLHandler] No text data in share intent');
      Alert.alert(
        'エラー',
        '共有データからテキストが見つかりませんでした。'
      );
      return;
    }

    // テキストからURLを抽出
    const extractedURL = extractURLFromText(sharedText);

    if (!extractedURL) {
      console.warn('[SharedURLHandler] No valid URL found in share intent');
      Alert.alert(
        'エラー',
        '共有されたテキストから有効なURLが見つかりませんでした。'
      );
      return;
    }

    console.log('[SharedURLHandler] Extracted URL from share intent:', extractedURL);

    // === シンプルな重複防止ロジック ===
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
      console.log('[SharedURLHandler] Duplicate URL detected in share intent, skipping');
      return;
    }

    // URLを処理リストに追加
    const urlKey = `${extractedURL}-${now}`;
    processedURLsRef.current.add(urlKey);
    console.log('[SharedURLHandler] Processing share intent URL:', extractedURL);

    try {
      // タイトル取得
      let title = extractedURL;
      try {
        const fetchedTitle = await fetchUrlTitle(extractedURL);
        title = fetchedTitle || extractedURL;
      } catch (error) {
        console.warn('[SharedURLHandler] Failed to fetch title for share intent, using URL');
      }

      // Firestoreに保存
      await createLink(
        user.uid,
        extractedURL,
        title,
        [] // tags
      );

      console.log('[SharedURLHandler] Successfully saved shared URL:', extractedURL);

      Alert.alert(
        '共有URLを追加しました',
        `リンク「${title}」を保存しました`
      );
    } catch (error) {
      console.error('[SharedURLHandler] Error saving shared URL:', error);

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
