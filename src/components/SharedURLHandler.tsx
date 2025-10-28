import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getPendingSharedURLs, clearPendingSharedURLs } from '../services/sharedGroup';
import { createLink } from '../services/firestore';
import { fetchURLMetadata } from '../utils/urlMetadata';

/**
 * Share Extensionから共有されたURLを処理するコンポーネント
 * アプリがフォアグラウンドになった時に自動的に処理する
 */
const SharedURLHandler: React.FC = () => {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 初回マウント時にチェック
    processSharedURLs();

    // AppStateの変更を監視
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // バックグラウンドからアクティブに戻った時
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      processSharedURLs();
    }

    appState.current = nextAppState;
  };

  const processSharedURLs = async () => {
    if (!user) return;

    try {
      const pendingURLs = await getPendingSharedURLs();

      if (pendingURLs.length === 0) return;

      console.log(`Processing ${pendingURLs.length} shared URL(s)...`);

      let successCount = 0;
      let failCount = 0;

      // 各URLを処理
      for (const url of pendingURLs) {
        try {
          // メタデータを取得
          const metadata = await fetchURLMetadata(url);

          // Firestoreに保存
          await createLink(
            user.uid,
            url,
            metadata.title || url,
            metadata.description || '',
            metadata.imageUrl || undefined,
            []
          );

          successCount++;
          console.log(`Successfully added shared URL: ${url}`);
        } catch (error) {
          failCount++;
          console.error(`Failed to add shared URL: ${url}`, error);
        }
      }

      // 処理済みのURLをクリア
      await clearPendingSharedURLs();

      // 結果を通知
      if (successCount > 0) {
        Alert.alert(
          '共有URLを追加しました',
          `${successCount}件のリンクを追加しました${failCount > 0 ? `\n（${failCount}件は失敗しました）` : ''}`
        );
      } else if (failCount > 0) {
        Alert.alert('エラー', `共有URLの追加に失敗しました（${failCount}件）`);
      }
    } catch (error) {
      console.error('Error processing shared URLs:', error);
    }
  };

  return null; // このコンポーネントはUIを持たない
};

export default SharedURLHandler;
