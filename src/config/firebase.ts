import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import 'react-native-get-random-values';

/**
 * Firebase設定オブジェクト
 * app.config.js の extra フィールドから環境変数を取得します
 * ローカルビルド時は .env ファイルから、EASクラウドビルド時は eas.json の env から読み込まれます
 */
const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey || 'your-api-key',
  authDomain: extra.firebaseAuthDomain || 'your-auth-domain',
  projectId: extra.firebaseProjectId || 'your-project-id',
  storageBucket: extra.firebaseStorageBucket || 'your-storage-bucket',
  messagingSenderId: extra.firebaseMessagingSenderId || 'your-messaging-sender-id',
  appId: extra.firebaseAppId || 'your-app-id',
};

/**
 * Firebaseアプリケーションの初期化
 * 既に初期化されている場合は既存のインスタンスを使用
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Firebase Authentication インスタンス
 * React Native用のAsyncStorage永続化を使用
 *
 * Note: Firebase v12ではgetReactNativePersistenceが削除されているため、
 * initializeAuth with AsyncStorageを直接使用します。
 */
function getReactNativePersistence(storage: any) {
  return {
    async _get(key: string) {
      const value = await storage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    async _set(key: string, value: any) {
      await storage.setItem(key, JSON.stringify(value));
    },
    async _remove(key: string) {
      await storage.removeItem(key);
    },
    _addListener() {},
    _removeListener() {},
    type: 'LOCAL' as const,
  };
}

export const auth = (() => {
  const apps = getApps();
  if (apps.length > 0) {
    try {
      return getAuth(app);
    } catch {
      // Auth not initialized yet
    }
  }

  // Initialize auth with React Native persistence
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
})();

/**
 * Cloud Firestore インスタンス
 */
export const db = getFirestore(app);

export default app;
