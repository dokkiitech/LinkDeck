# LinkDeck - プロジェクトドキュメント

## プロジェクト概要

LinkDeckは、Webブラウジング中に見つけた有益な情報や後で読みたい記事のURLを簡単に保存・整理し、AIによる要約機能で効率的に内容を把握することを目的としたモバイルアプリケーションです。

## 実装状況（2025年10月16日時点）

### ✅ 実装済み機能

1. **プロジェクト基盤**
   - Expo + React Native + TypeScriptでのプロジェクト初期化
   - Firebase SDK統合（Authentication、Firestore）
   - React Navigation統合（Stack、Tab、Bottom Tab Navigator）
   - プロジェクト構造の構築（src/配下の整理）

2. **認証機能**
   - Firebase Authenticationを使用したメール/パスワード認証
   - AuthContextによる認証状態管理
   - ログイン画面、サインアップ画面の実装
   - ログアウト機能

3. **リンク管理機能**
   - リンク一覧表示画面（LinksListScreen）
   - リンク詳細表示画面（LinkDetailScreen）
   - リンクの削除機能
   - アーカイブ機能（トグル）
   - OGP画像、タイトル、説明文の表示

4. **タグ管理機能**
   - タグ作成・削除機能
   - タグ一覧表示画面（TagsScreen）
   - タグとリンクの紐付け（データモデル上）

5. **Firestoreサービス層**
   - リンクのCRUD操作
   - タグのCRUD操作
   - ユーザーごとのデータフィルタリング
   - タグによるリンクの絞り込み

6. **設定画面**
   - アカウント情報表示
   - Gemini APIキー設定フォーム（UI実装済み、機能は準備中）
   - ログアウト機能

7. **TypeScript型定義**
   - User、Link、Tag型の定義
   - Firestore Document型の定義
   - Navigation型の定義

### 🚧 実装準備中の機能

1. **iOS共有拡張機能（Share Extension）**
   - 他のアプリからURLを直接保存する機能
   - URLの自動抽出（正規表現による）

2. **URLメタデータ自動取得**
   - OGP情報（タイトル、説明文、画像）の自動スクレイピング
   - Cloud Functions for Firebaseでの実装を推奨

3. **AI要約機能（Gemini API統合）**
   - ユーザーのGemini APIキーの暗号化保存
   - URLコンテンツのスクレイピング
   - Gemini APIへのリクエストと要約生成
   - 生成された要約のキャッシュ

4. **UI/UX改善**
   - ダークモード対応
   - タイムライン表示機能
   - リンクの検索機能
   - 無限スクロールの実装

## プロジェクト構造

```
LinkDeck/
├── src/
│   ├── config/              # Firebase設定
│   │   └── firebase.ts      # Firebaseの初期化
│   ├── contexts/            # React Context
│   │   └── AuthContext.tsx  # 認証状態管理
│   ├── navigation/          # ナビゲーション
│   │   ├── AppNavigator.tsx     # ルートナビゲーター
│   │   ├── AuthNavigator.tsx    # 認証画面ナビゲーター
│   │   ├── MainNavigator.tsx    # メイン画面タブナビゲーター
│   │   └── LinksNavigator.tsx   # リンク画面スタックナビゲーター
│   ├── screens/             # 画面コンポーネント
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignUpScreen.tsx
│   │   ├── links/
│   │   │   ├── LinksListScreen.tsx
│   │   │   ├── LinkDetailScreen.tsx
│   │   │   └── TagsScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   ├── services/            # サービス層
│   │   └── firestore.ts     # Firestore操作
│   ├── types/               # TypeScript型定義
│   │   └── index.ts
│   ├── components/          # 再利用可能なコンポーネント（未使用）
│   ├── hooks/               # カスタムフック（未使用）
│   └── utils/               # ユーティリティ関数（未使用）
├── assets/                  # 画像・アイコン
├── App.tsx                  # エントリーポイント
├── .env.example             # 環境変数のテンプレート
├── README.md                # プロジェクト説明
├── SETUP_GUIDE.md           # セットアップガイド
└── package.json             # 依存関係
```

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
  description?: string;
  imageUrl?: string;        // OGP画像
  summary?: string;         // AI生成の要約
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

## Firestoreセキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /links/{linkId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /tags/{tagId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 技術的な特徴

### 1. 認証状態管理
- React Contextを使用したグローバルな認証状態管理
- onAuthStateChangedによるリアルタイム認証状態監視
- 自動的なログイン/ログアウト処理

### 2. ナビゲーション構造
- 認証状態に応じた画面切り替え（Auth Navigator ⇔ Main Navigator）
- タブナビゲーションによる主要機能へのアクセス
- スタックナビゲーションによる詳細画面への遷移

### 3. Firestoreデータアクセス
- サービス層による抽象化
- TypeScriptによる型安全性
- TimestampとDateの相互変換

### 4. UI/UXデザイン
- iOS Human Interface Guidelinesに準拠したデザイン
- カラースキーム:
  - プライマリ: #007AFF（iOS Blue）
  - 背景: #F2F2F7（Light Gray）
  - カード: #FFFFFF（White）
- モダンなカード型UI

## 依存パッケージ

### 主要パッケージ
- `expo`: ~54.0.13
- `react`: 19.1.0
- `react-native`: 0.81.4
- `firebase`: ^12.4.0
- `@react-navigation/native`: ^7.1.18
- `@react-navigation/native-stack`: ^7.3.28
- `@react-navigation/bottom-tabs`: ^7.4.9
- `@google/generative-ai`: ^0.24.1

### ユーティリティ
- `react-native-get-random-values`: Firebaseで必要
- `react-native-screens`: ナビゲーション最適化
- `react-native-safe-area-context`: セーフエリア対応

## 今後の実装計画

### フェーズ1: コア機能の完成
1. URLメタデータ自動取得機能
2. iOS共有拡張機能
3. Gemini API統合とAI要約機能

### フェーズ2: UI/UX改善
1. ダークモード対応
2. タイムライン表示
3. リンク検索機能
4. 無限スクロール

### フェーズ3: 高度な機能
1. リンクのエクスポート機能
2. ブックマークレット
3. プッシュ通知
4. オフライン対応

## 開発ガイドライン

### コードスタイル
- TypeScriptの厳格な型チェック
- 関数コンポーネントとHooksの使用
- async/awaitによる非同期処理

### ファイル命名規則
- コンポーネント: PascalCase（例: `LoginScreen.tsx`）
- ユーティリティ: camelCase（例: `firestore.ts`）
- 型定義: PascalCase（例: `User`, `Link`）

### コミットメッセージ
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント更新
- style: コードスタイルの変更
- refactor: リファクタリング
- test: テスト追加

## トラブルシューティング

### Firebase接続エラー
- `.env` ファイルの設定を確認
- 開発サーバーを再起動

### ビルドエラー
```bash
rm -rf node_modules
npm install
npx expo start -c
```

### 型エラー
- `@types/react` のバージョンを確認
- TypeScriptのバージョンを確認

## 参考リソース

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

---

**最終更新**: 2025年10月16日
**バージョン**: 1.0.0
**開発状況**: MVP（最小限の機能実装）完了
