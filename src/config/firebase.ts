import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';
import 'react-native-get-random-values';

/**
 * Firebase設定オブジェクト
 * app.config.jsのextraフィールドから環境変数を取得
 * ビルド時に.envファイルの値が埋め込まれる
 */
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
 */
export const auth = getAuth(app);

/**
 * Cloud Firestore インスタンス
 */
export const db = getFirestore(app);

export default app;
