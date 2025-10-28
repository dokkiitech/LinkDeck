# LinkDeck

**LinkDeck（リンクデッキ）** は、Webブラウジング中に見つけた有益な情報や後で読みたい記事のURLを簡単に保存・整理し、AIによる要約機能で効率的に内容を把握することを目的としたモバイルアプリケーションです。

## 主な機能

- ✅ **ユーザー認証**: Firebase Authenticationを使用したメールアドレス/パスワードによる認証
- ✅ **URL追加機能**: アプリ内からURLを追加（テキストからURLを自動抽出）
- ✅ **URLメタデータ自動取得**: OGP情報（タイトル、説明文、画像）を自動取得
- ✅ **AI要約機能**: Gemini APIを使用したコンテンツの要約生成
- ✅ **タグ管理**: カスタムタグを作成してリンクを分類・整理
- ✅ **リンク一覧表示**: 保存したURLを見やすい形式で一覧表示
- ✅ **リンク詳細表示**: OGP画像、タイトル、説明文、AI要約などを表示
- 🚧 **iOS共有拡張機能**: 他のアプリから直接リンクを保存（Share Extension実装予定）

## 技術スタック

- **フロントエンド**: React Native / Expo
- **言語**: TypeScript
- **バックエンド/DB**: Firebase
  - Cloud Firestore（データベース）
  - Firebase Authentication（認証）
- **AI**: Google AI (Gemini API)
- **ナビゲーション**: React Navigation

## プロジェクト構造

```
LinkDeck/
├── src/
│   ├── config/          # Firebase設定
│   ├── contexts/        # React Context (認証など)
│   ├── navigation/      # ナビゲーション構造
│   ├── screens/         # 画面コンポーネント
│   │   ├── auth/        # 認証画面
│   │   ├── links/       # リンク管理画面
│   │   └── settings/    # 設定画面
│   ├── services/        # Firestoreサービス層
│   ├── types/           # TypeScript型定義
│   └── utils/           # ユーティリティ関数
├── assets/              # 画像・アイコンなどのアセット
├── App.tsx              # アプリケーションエントリーポイント
└── package.json
```

## セットアップ手順

### 1. 前提条件

- Node.js (v20.18.3以上)
- npm または yarn
- Expo CLI
- iOSシミュレータ（Macの場合）またはAndroidエミュレータ

### 2. リポジトリのクローンと依存関係のインストール

```bash
cd LinkDeck
npm install
```

### 3. Firebase プロジェクトのセットアップ

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. Firebase Authentication を有効化
   - メール/パスワード認証を有効にする
4. Cloud Firestore を有効化
   - テストモードで開始（後でセキュリティルールを設定）

### 4. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、Firebase設定情報を記入：

```bash
cp .env.example .env
```

`.env` ファイルに以下の情報を入力：

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 5. Firestore セキュリティルールの設定

⚠️ **重要**: この設定を行わないと、アプリが正常に動作しません。

#### 方法A: Firebase CLI（推奨）

```bash
# Firebase CLIをインストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクトを選択
firebase use --add
# → あなたのプロジェクトIDを選択

# セキュリティルールをデプロイ
firebase deploy --only firestore:rules
```

詳細: [DEPLOY_FIRESTORE_RULES.md](DEPLOY_FIRESTORE_RULES.md)

#### 方法B: Firebase Console（手動）

Firebase Consoleで[`firestore.rules`](firestore.rules)ファイルの内容をコピー＆ペーストして公開

詳細: [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)

### 6. アプリケーションの起動

```bash
# 開発サーバーの起動
npm start

# iOSで起動
npm run ios

# Androidで起動
npm run android
```

## 使い方

### 1. アカウント作成とログイン

1. アプリを起動
2. 「アカウントをお持ちでない方はこちら」をタップ
3. 表示名、メールアドレス、パスワードを入力して登録
4. ログイン画面に戻り、メールアドレスとパスワードでログイン

### 2. リンクの保存（現在は手動入力のみ）

現在、iOS共有拡張機能は実装準備中です。当面は以下の方法でリンクを追加できます：

- Firestore コンソールから直接データを追加
- 将来的には他のアプリからの共有機能で保存可能

### 3. タグの管理

1. 下部タブバーから「タグ」をタップ
2. 新しいタグ名を入力して「作成」ボタンをタップ
3. タグを長押しして削除

### 4. AI要約機能の使用（実装準備中）

1. 設定画面に移動
2. Google AI StudioでGemini APIキーを取得
3. APIキーを設定画面に入力して保存
4. リンク詳細画面で「AI要約を生成」ボタンをタップ

## 今後の実装予定

- [ ] iOS共有拡張機能（Share Extension）
- [ ] URLメタデータの自動取得機能
- [ ] Gemini API統合による要約生成
- [ ] タイムライン表示機能
- [ ] リンクの検索機能
- [ ] ダークモード対応
- [ ] アーカイブ機能の拡張

## トラブルシューティング

### Firebase接続エラー

`.env` ファイルの設定が正しいか確認してください。特に、`EXPO_PUBLIC_` プレフィックスが必要です。

### ビルドエラー

```bash
# node_modulesとキャッシュをクリア
rm -rf node_modules
npm install
npx expo start -c
```

## ライセンス

このプロジェクトはプライベートプロジェクトです。

## 作者

LinkDeck開発チーム

## ローカルビルドコマンド
```
eas build --platform ios --local
eas build --local --profile production
```