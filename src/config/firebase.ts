import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';
import 'react-native-get-random-values';

/**
 * Firebase設定オブジェクト
 * app.config.jsのextraフィールドから環境変数を取得
 * ビルド時に.envファイルの値が埋め込まれる
 */
const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// デバッグ用: 設定の検証
if (__DEV__) {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'NOT SET',
    authDomain: firebaseConfig.authDomain || 'NOT SET',
    projectId: firebaseConfig.projectId || 'NOT SET',
  });
}

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
