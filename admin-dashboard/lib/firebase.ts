import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 環境変数のチェック（開発時のみ）
if (typeof window !== 'undefined' && (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-api-key')) {
  console.error('❌ Firebase環境変数が設定されていません');
  console.error('📝 .envファイルを確認してください');
  console.error('現在の設定:', {
    apiKey: firebaseConfig.apiKey || '未設定',
    projectId: firebaseConfig.projectId || '未設定',
  });
}

// Initialize Firebase (クライアント側)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
