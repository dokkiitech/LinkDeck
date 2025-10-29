import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // アプリ起動時の初期URLを処理
    handleInitialURL();

    // アプリがフォアグラウンドにある時のURL受信を監視
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [user]);

  const handleInitialURL = async () => {
    const url = await Linking.getInitialURL();
    if (url) {
      await processURL(url);
    }
  };

  const handleDeepLink = (event: { url: string }) => {
    processURL(event.url);
  };

  const processURL = async (url: string) => {
    if (!user || isProcessing) return;

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
      Alert.alert(
        'エラー',
        '共有URLの追加に失敗しました'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return null; // このコンポーネントはUIを持たない
};

export default SharedURLHandler;
