# コードベース構造の詳細

## ディレクトリ構造

```
LinkDeck/
├── .serena/              # Serenaメモリーファイル
├── assets/               # 画像・アイコン・スプラッシュ画面
├── src/                  # ソースコード
│   ├── config/           # 設定ファイル
│   │   └── firebase.ts   # Firebase初期化設定
│   ├── contexts/         # React Context
│   │   └── AuthContext.tsx  # 認証状態管理
│   ├── navigation/       # ナビゲーション定義
│   │   ├── AppNavigator.tsx        # ルートナビゲーター
│   │   ├── AuthNavigator.tsx       # 認証画面ナビゲーター
│   │   ├── MainNavigator.tsx       # メイン画面タブナビゲーター
│   │   ├── LinksNavigator.tsx      # リンク画面スタックナビゲーター
│   │   ├── TagsNavigator.tsx       # タグ画面スタックナビゲーター
│   │   └── SettingsNavigator.tsx   # 設定画面スタックナビゲーター
│   ├── screens/          # 画面コンポーネント
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx     # ログイン画面
│   │   │   └── SignUpScreen.tsx    # サインアップ画面
│   │   ├── links/
│   │   │   ├── LinksListScreen.tsx    # リンク一覧
│   │   │   ├── AddLinkScreen.tsx      # リンク追加
│   │   │   ├── LinkDetailScreen.tsx   # リンク詳細
│   │   │   ├── ArchivedLinksScreen.tsx # アーカイブ済みリンク
│   │   │   └── TagsScreen.tsx         # タグ一覧（旧）
│   │   ├── tags/
│   │   │   └── TagLinksScreen.tsx  # タグ別リンク一覧
│   │   └── settings/
│   │       ├── SettingsScreen.tsx       # 設定画面
│   │       └── UpgradeAccountScreen.tsx # アカウントアップグレード
│   ├── services/         # ビジネスロジック層
│   │   ├── firestore.ts      # Firestore操作
│   │   ├── gemini.ts         # Gemini API統合
│   │   └── sharedGroup.ts    # 共有グループ機能
│   ├── types/            # TypeScript型定義
│   │   └── index.ts      # すべての型定義
│   ├── components/       # 再利用可能なコンポーネント
│   │   └── SharedURLHandler.tsx  # URL共有ハンドラー
│   ├── hooks/            # カスタムフック（現在未使用）
│   └── utils/            # ユーティリティ関数
│       ├── storage.ts        # ローカルストレージ操作
│       └── urlMetadata.ts    # URLメタデータ取得
├── App.tsx               # アプリケーションエントリーポイント
├── index.ts              # メインエントリーポイント
├── app.config.js         # Expo設定
├── tsconfig.json         # TypeScript設定
├── package.json          # 依存関係
├── .env                  # 環境変数（Gitignore対象）
├── .env.example          # 環境変数テンプレート
├── firestore.rules       # Firestoreセキュリティルール
├── CLAUDE.md             # プロジェクトドキュメント
├── README.md             # プロジェクト説明
└── SETUP_GUIDE.md        # セットアップガイド
```

## 主要ファイルの役割

### 設定関連

**app.config.js**
- Expo設定
- Firebase環境変数の読み込み
- iOS/Android固有の設定
- アプリのメタデータ（名前、バージョン、アイコン等）

**tsconfig.json**
- TypeScript設定
- 厳格な型チェック有効
- Expo TypeScript設定を継承

**firebase.ts**
- Firebase SDKの初期化
- Authentication、Firestoreの初期化
- 環境変数からの設定読み込み

### 認証関連

**AuthContext.tsx**
- React Contextを使用した認証状態管理
- `onAuthStateChanged`によるリアルタイム監視
- `useAuth` カスタムフックの提供
- ログイン、ログアウト、サインアップ機能

**LoginScreen.tsx / SignUpScreen.tsx**
- 認証UI
- Firebase Authenticationとの連携
- フォームバリデーション

### ナビゲーション関連

**AppNavigator.tsx**（ルート）
- 認証状態に応じた画面切り替え
- AuthNavigator ⇔ MainNavigator

**AuthNavigator.tsx**
- ログイン画面
- サインアップ画面

**MainNavigator.tsx**（タブ）
- Links タブ（LinksNavigator）
- Tags タブ（TagsNavigator）
- Settings タブ（SettingsNavigator）

**LinksNavigator.tsx**（スタック）
- LinksList（一覧）
- AddLink（追加）
- LinkDetail（詳細）
- ArchivedLinks（アーカイブ）

**TagsNavigator.tsx**（スタック）
- TagsList（タグ一覧）
- TagLinks（タグ別リンク一覧）

**SettingsNavigator.tsx**（スタック）
- SettingsMain（設定メイン）
- UpgradeAccount（アカウントアップグレード）

### サービス層

**firestore.ts**
主要な関数：
- `linksCollection()` - linksコレクションの参照取得
- `tagsCollection()` - tagsコレクションの参照取得
- `createLink(userId, url, title, tags)` - リンク作成
- `getUserLinks(userId)` - ユーザーのリンク一覧取得
- `getLink(linkId)` - 特定リンクの取得
- `updateLink(linkId, updates)` - リンク更新
- `deleteLink(linkId)` - リンク削除
- `createTag(userId, name)` - タグ作成
- `getUserTags(userId)` - ユーザーのタグ一覧取得
- `deleteTag(tagId)` - タグ削除
- `addTagToLink(linkId, tagName)` - リンクにタグを追加
- `removeTagFromLink(linkId, tagName)` - リンクからタグを削除
- `getLinksByTag(userId, tagName)` - タグでフィルタリング

**gemini.ts**
- Gemini API統合（準備中）
- AI要約生成機能

**sharedGroup.ts**
- 共有グループ機能（将来的な機能）

### 型定義

**src/types/index.ts**
主要な型：
- `User` / `UserDocument` - ユーザー情報
- `Link` / `LinkDocument` - リンク情報
- `Tag` / `TagDocument` - タグ情報
- `RootStackParamList` - ルートナビゲーションパラメータ
- `AuthStackParamList` - 認証画面パラメータ
- `MainTabParamList` - メインタブパラメータ
- `LinksStackParamList` - リンク画面パラメータ
- `TagsStackParamList` - タグ画面パラメータ
- `SettingsStackParamList` - 設定画面パラメータ

注意：各エンティティについて、アプリ用（Date）とFirestore用（Timestamp）の型を分離

### ユーティリティ

**storage.ts**
- AsyncStorageを使用したローカルデータ保存
- APIキーの保存/取得

**urlMetadata.ts**
- URLメタデータの取得（OGP情報等）
- Web スクレイピング機能

### コンポーネント

**SharedURLHandler.tsx**
- 他のアプリから共有されたURLの処理
- expo-linkingを使用

## アーキテクチャパターン

### レイヤー構造
1. **UI層** (screens/、components/) - React コンポーネント
2. **ナビゲーション層** (navigation/) - 画面遷移ロジック
3. **状態管理層** (contexts/) - React Context
4. **サービス層** (services/) - ビジネスロジックとデータアクセス
5. **データ層** (Firebase Firestore) - 永続化

### データフロー
```
UI (Screen) 
  ↓
Context (useAuth)
  ↓
Service (firestore.ts)
  ↓
Firebase Firestore
```

### 認証フロー
```
App起動
  ↓
AuthContext初期化
  ↓
onAuthStateChanged監視
  ↓
認証済み → MainNavigator
未認証 → AuthNavigator
```

## 未使用/準備中のディレクトリ

- `src/hooks/` - カスタムフック用（現在は`useAuth`がAuthContextに含まれる）
- `src/components/` - 再利用可能なコンポーネント（SharedURLHandlerのみ）

今後、共通コンポーネントやカスタムフックが増えた場合に活用予定。
