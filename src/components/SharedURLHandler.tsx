import { useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { createLink } from '../services/firestore';
import { fetchURLMetadata } from '../utils/urlMetadata';

/**
 * URLスキーム経由で共有されたURLを処理するコンポーネント
 * linkdeck://share?url=...&title=... の形式で受け取る
 */
const SharedURLHandler: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const processedURLsRef = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  useEffect(() => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      return;
    }

    // 初回のみ実行
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      handleInitialURL();
    }

    // アプリがフォアグラウンドにある時のURL受信を監視
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [user]); // userを依存配列に戻す

  const handleInitialURL = async () => {
    try {
      const url = await Linking.getInitialURL();
      if (url) {
        await processURL(url);
      }
    } catch (error) {
      console.error('Error handling initial URL:', error);
    }
  };

  const handleDeepLink = (event: { url: string }) => {
    processURL(event.url).catch(error => {
      console.error('Error handling deep link:', error);
    });
  };

  const processURL = async (url: string) => {
    // ユーザーがログインしていない場合は処理しない
    if (!user) {
      console.log('User not logged in, skipping URL processing');
      return;
    }

    // 既に処理中の場合はスキップ
    if (isProcessing) {
      console.log('Already processing a URL, skipping');
      return;
    }

    try {
      // URLをパース
      const parsed = Linking.parse(url);

      // linkdeck://share?url=...&title=... の形式をチェック
      if (parsed.hostname !== 'share') {
        return;
      }

      const queryParams = parsed.queryParams as { url?: string; title?: string };
      const sharedURL = queryParams.url;

      if (!sharedURL || typeof sharedURL !== 'string') {
        console.warn('Invalid shared URL:', url);
        return;
      }

      // 重複チェック：同じURLを短時間に処理しない
      const urlKey = `${sharedURL}-${Date.now()}`;
      const recentKey = Array.from(processedURLsRef.current).find(key => 
        key.startsWith(sharedURL) && Date.now() - parseInt(key.split('-').pop() || '0') < 5000
      );
      
      if (recentKey) {
        console.log('URL already processed recently, skipping:', sharedURL);
        return;
      }

      processedURLsRef.current.add(urlKey);
      
      // 古いエントリをクリーンアップ（10秒以上前のものを削除）
      const now = Date.now();
      processedURLsRef.current.forEach(key => {
        const timestamp = parseInt(key.split('-').pop() || '0');
        if (now - timestamp > 10000) {
          processedURLsRef.current.delete(key);
        }
      });

      setIsProcessing(true);

      console.log(`Processing shared URL: ${sharedURL}`);

      // タイトルが指定されていればそれを使用、なければメタデータを取得
      let title = queryParams.title && typeof queryParams.title === 'string'
        ? queryParams.title
        : undefined;

      if (!title) {
        try {
          const metadata = await fetchURLMetadata(sharedURL);
          title = metadata.title || sharedURL;
        } catch (error) {
          console.warn('Failed to fetch metadata, using URL as title:', error);
          title = sharedURL;
        }
      }

      // Firestoreに保存
      await createLink(
        user.uid,
        sharedURL,
        title,
        [] // tags
      );

      console.log(`Successfully added shared URL: ${sharedURL}`);

      Alert.alert(
        '共有URLを追加しました',
        `リンク「${title}」を保存しました`
      );
    } catch (error) {
      console.error('Error processing shared URL:', error);
      
      // エラーの詳細をログに出力
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      Alert.alert(
        'エラー',
        '共有URLの追加に失敗しました。もう一度お試しください。'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return null; // このコンポーネントはUIを持たない
};

export default SharedURLHandler;
