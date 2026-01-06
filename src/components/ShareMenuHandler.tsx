import { useEffect, useRef } from 'react';
import ShareMenu, { ShareData } from 'react-native-share-menu';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { createLink } from '../services/firestore';
import { fetchUrlTitle } from '../utils/urlMetadata';
import { extractURLFromText } from '../utils/urlValidation';

/**
 * react-native-share-menuを使用してネイティブ共有メニューからのインポートを処理するコンポーネント
 * 他のアプリからの「共有」機能で直接リンクを受け取る
 */
const ShareMenuHandler: React.FC = () => {
  const { user } = useAuth();
  const isProcessingRef = useRef(false);
  const processedURLsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      return;
    }

    // アプリが共有データで起動された場合の処理（初回起動時）
    ShareMenu.getInitialShare((shareData: ShareData | null) => {
      if (shareData) {
        console.log('[ShareMenuHandler] Initial share data:', shareData);
        handleSharedData(shareData);
      }
    });

    // アプリが既に起動している状態で共有データを受け取った場合のリスナー
    const listener = ShareMenu.addNewShareListener((shareData: ShareData | null) => {
      if (shareData) {
        console.log('[ShareMenuHandler] New share data:', shareData);
        handleSharedData(shareData);
      }
    });

    // クリーンアップ
    return () => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    };
  }, [user]);

  const handleSharedData = async (shareData: ShareData) => {
    // ユーザーがログインしていない場合は処理しない
    if (!user) {
      console.log('[ShareMenuHandler] User not logged in, skipping');
      return;
    }

    // 既に処理中なら即座にブロック
    if (isProcessingRef.current) {
      console.log('[ShareMenuHandler] Already processing, blocking duplicate event');
      return;
    }

    // ロック取得
    isProcessingRef.current = true;
    console.log('[ShareMenuHandler] Lock acquired');

    try {
      await processSharedData(shareData);
    } catch (error) {
      console.error('[ShareMenuHandler] Error in processSharedData:', error);
    } finally {
      // ロック解放
      isProcessingRef.current = false;
      console.log('[ShareMenuHandler] Lock released');
    }
  };

  const processSharedData = async (shareData: ShareData) => {
    if (!user) {
      return;
    }

    // データから共有テキストまたはURLを抽出
    let sharedText = '';

    if (shareData.data) {
      // data プロパティにテキストやURLが含まれる
      if (typeof shareData.data === 'string') {
        sharedText = shareData.data;
      } else if (Array.isArray(shareData.data) && shareData.data.length > 0) {
        sharedText = shareData.data[0];
      }
    }

    // mimeType が 'text/plain' の場合もテキストとして処理
    if (!sharedText && shareData.mimeType === 'text/plain') {
      sharedText = shareData.data as string;
    }

    if (!sharedText || typeof sharedText !== 'string') {
      console.warn('[ShareMenuHandler] No valid shared text found');
      Alert.alert(
        'エラー',
        '共有されたデータを読み込めませんでした。'
      );
      return;
    }

    console.log('[ShareMenuHandler] Shared text:', sharedText);

    // テキストからURLを抽出
    const extractedURL = extractURLFromText(sharedText);

    if (!extractedURL) {
      console.warn('[ShareMenuHandler] No valid URL found');
      Alert.alert(
        'エラー',
        '共有されたテキストから有効なURLが見つかりませんでした。'
      );
      return;
    }

    console.log('[ShareMenuHandler] Extracted URL:', extractedURL);

    // 重複防止ロジック（5秒以内の重複をスキップ）
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
      console.log('[ShareMenuHandler] Duplicate URL detected, skipping');
      return;
    }

    // URLを処理リストに追加
    const urlKey = `${extractedURL}-${now}`;
    processedURLsRef.current.add(urlKey);
    console.log('[ShareMenuHandler] Processing:', extractedURL);

    try {
      // タイトル取得
      let title = extractedURL;
      try {
        const fetchedTitle = await fetchUrlTitle(extractedURL);
        title = fetchedTitle || extractedURL;
      } catch (error) {
        console.warn('[ShareMenuHandler] Failed to fetch title, using URL');
      }

      // Firestoreに保存
      await createLink(
        user.uid,
        extractedURL,
        title,
        [] // tags
      );

      console.log('[ShareMenuHandler] Successfully saved:', extractedURL);

      Alert.alert(
        '共有リンクを追加しました',
        `リンク「${title}」を保存しました`
      );
    } catch (error) {
      console.error('[ShareMenuHandler] Error saving URL:', error);

      // エラー時は処理リストから削除（再試行可能に）
      processedURLsRef.current.delete(urlKey);

      Alert.alert(
        'エラー',
        '共有リンクの追加に失敗しました。もう一度お試しください。'
      );
    }
  };

  return null; // このコンポーネントはUIを持たない
};

export default ShareMenuHandler;
