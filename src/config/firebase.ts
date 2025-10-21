import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';

/**
 * Firebase設定オブジェクト
 * 実際の使用時には、環境変数から取得するか、.env ファイルを使用することを推奨します
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-auth-domain',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-storage-bucket',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'your-messaging-sender-id',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'your-app-id',
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
