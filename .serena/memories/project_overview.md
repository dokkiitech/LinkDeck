# LinkDeck - プロジェクト概要

## プロジェクトの目的

LinkDeckは、Webブラウジング中に見つけた有益な情報や後で読みたい記事のURLを簡単に保存・整理し、AIによる要約機能で効率的に内容を把握することを目的としたモバイルアプリケーションです。

## 技術スタック

### コア技術
- **フロントエンド**: React Native 0.81.4 / Expo ~54.0.13
- **言語**: TypeScript ~5.9.2
- **バックエンド/DB**: Firebase 12.4.0
  - Cloud Firestore（データベース）
  - Firebase Authentication（認証）
- **AI**: Google Generative AI (Gemini API) 0.24.1
- **ナビゲーション**: React Navigation 7.x
  - @react-navigation/native
  - @react-navigation/native-stack
  - @react-navigation/bottom-tabs

### 主要な依存関係
- `react`: 19.1.0
- `@expo/vector-icons`: 15.0.2
- `@react-native-async-storage/async-storage`: 2.2.0
- `expo-linking`, `expo-sharing`, `expo-web-browser`
- `react-native-get-random-values`: Firebase必須
- `react-native-safe-area-context`: 5.6.1
- `react-native-screens`: 4.16.0

## データモデル

### users コレクション
```typescript
{
  uid: string;              // Firebase AuthのユーザーID（ドキュメントID）
  email: string | null;
  displayName: string | null;
  createdAt: Timestamp;
  geminiApiKey?: string;    // 暗号化されたAPIキー
}
```

### links コレクション
```typescript
{
  id: string;               // 自動生成ID
  userId: string;           // 作成したユーザーのuid
  url: string;
  title: string;
  tags: string[];           // タグ名の配列
  isArchived: boolean;
  createdAt: Timestamp;
}
```

### tags コレクション
```typescript
{
  id: string;               // 自動生成ID
  userId: string;           // 作成したユーザーのuid
  name: string;
  createdAt: Timestamp;
}
```

## 実装状況

### ✅ 実装済み
- ユーザー認証（メール/パスワード）
- リンク管理（CRUD操作、アーカイブ）
- タグ管理（作成、削除、紐付け）
- Firestore統合
- React Navigation統合

### 🚧 準備中
- iOS共有拡張機能（Share Extension）
- AI要約機能（Gemini API統合）
- ダークモード対応
- リンク検索機能
- 無限スクロール

### ❌ 削除された機能
- OGP（Open Graph Protocol）メタデータ自動取得機能（2025年10月29日削除）
  - よりシンプルなリンク管理に焦点を当てた設計に変更

## 環境設定

プロジェクトは`.env`ファイルでFirebase設定を管理しています：
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## アプリ設定

- **Bundle Identifier (iOS)**: com.linkdeck.app
- **Package Name (Android)**: com.linkdeck.app
- **Expo Project ID**: 97bb1c45-d7d5-4f3d-8c6f-5a5cd4c60be3
- **Scheme**: linkdeck
