# LinksDeck セットアップガイド

このガイドでは、LinksDeckアプリケーションを初めてセットアップし、起動するまでの詳細な手順を説明します。

## 目次

1. [必要な環境](#必要な環境)
2. [Firebaseプロジェクトの作成](#firebaseプロジェクトの作成)
3. [環境変数の設定](#環境変数の設定)
4. [Firestoreセキュリティルールの設定](#firestoreセキュリティルールの設定)
5. [アプリケーションの起動](#アプリケーションの起動)
6. [動作確認](#動作確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 必要な環境

以下のツールがインストールされていることを確認してください：

- **Node.js**: v20.18.3以上
- **npm**: v11.5.1以上
- **Expo CLI**: `npm install -g expo-cli`
- **iOS開発環境** (Macの場合):
  - Xcode (最新版)
  - iOS Simulator
- **Android開発環境**:
  - Android Studio
  - Android Emulator

---

## Firebaseプロジェクトの作成

### 1. Firebase Consoleにアクセス

[Firebase Console](https://console.firebase.google.com/) にアクセスし、Googleアカウントでログインします。

### 2. 新しいプロジェクトを作成

1. 「プロジェクトを追加」をクリック
2. プロジェクト名を入力（例: `linkdeck-app`）
3. Google Analyticsの設定（オプション）
4. 「プロジェクトを作成」をクリック

### 3. iOSアプリを追加

1. プロジェクトのホーム画面で「iOS」アイコンをクリック
2. バンドルIDを入力（例: `com.yourname.linkdeck`）
3. アプリのニックネーム: `LinksDeck`
4. 「アプリを登録」をクリック
5. `GoogleService-Info.plist` をダウンロード（後で使用）
6. 残りの手順はスキップ可能

### 4. Firebase Authenticationの設定

1. 左側のメニューから「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブを選択
4. 「メール/パスワード」を有効化
5. 保存

### 5. Cloud Firestoreの設定

1. 左側のメニューから「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. ロケーションを選択（例: `asia-northeast1` - 東京）
4. 「テストモードで開始」を選択
5. 「有効にする」をクリック

### 6. Firebase設定情報の取得

1. プロジェクトの設定（歯車アイコン）→「プロジェクトの設定」
2. 「全般」タブにスクロール
3. 「マイアプリ」セクションでiOSアプリを選択
4. 以下の情報をコピー：
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID

---

## 環境変数の設定

### 1. .envファイルの作成

プロジェクトルートで以下のコマンドを実行：

```bash
cp .env.example .env
```

### 2. Firebase設定情報を記入

`.env` ファイルを開き、先ほど取得したFirebase設定情報を記入：

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=linkdeck-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=linkdeck-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=linkdeck-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:ios:abcdef123456
```

**重要**: `.env` ファイルは `.gitignore` に追加されているため、Gitにコミットされません。

---

## Firestoreセキュリティルールの設定

### 1. Firebase Consoleでセキュリティルールを設定

1. Firebase Console → Firestore Database
2. 「ルール」タブを選択
3. 以下のルールをコピーして貼り付け：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーが自分のデータのみアクセス可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // リンクは作成したユーザーのみアクセス可能
    match /links/{linkId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // タグは作成したユーザーのみアクセス可能
    match /tags/{tagId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

4. 「公開」をクリック

---

## アプリケーションの起動

### 1. 依存関係のインストール

既にインストール済みの場合はスキップ可能：

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm start
```

または

```bash
npx expo start
```

### 3. アプリの起動

ターミナルに表示されるQRコードまたはオプションから選択：

- **iOSシミュレータで起動**: `i` キーを押す
- **Androidエミュレータで起動**: `a` キーを押す
- **実機で起動**: Expo Goアプリ（App Store/Google Play）でQRコードをスキャン

---

## 動作確認

### 1. アカウント作成のテスト

1. アプリが起動したらログイン画面が表示される
2. 「アカウントをお持ちでない方はこちら」をタップ
3. 以下の情報を入力：
   - 表示名: `テストユーザー`
   - メールアドレス: `test@example.com`
   - パスワード: `test1234`
4. 「登録」をタップ
5. 登録が成功すると、ログイン画面に戻る

### 2. ログインのテスト

1. 作成したメールアドレスとパスワードを入力
2. 「ログイン」をタップ
3. メイン画面（リンク一覧）が表示される

### 3. タグ作成のテスト

1. 下部タブバーから「タグ」をタップ
2. 新しいタグ名を入力（例: `技術記事`）
3. 「作成」ボタンをタップ
4. タグが一覧に表示される

### 4. Firestoreでデータ確認

1. Firebase Console → Firestore Database
2. 「データ」タブ
3. `users`、`tags` コレクションにデータが保存されていることを確認

---

## トラブルシューティング

### Firebase接続エラー

**エラー**: `Firebase: Error (auth/invalid-api-key)`

**解決策**:
- `.env` ファイルの設定が正しいか確認
- `EXPO_PUBLIC_` プレフィックスが付いているか確認
- 開発サーバーを再起動: `Ctrl+C` → `npm start`

### ビルドエラー

**エラー**: `Module not found` または `Cannot find module`

**解決策**:
```bash
rm -rf node_modules
rm package-lock.json
npm install
npx expo start -c
```

### iOSシミュレータが起動しない

**解決策**:
1. Xcodeを起動
2. Xcode → Preferences → Locations
3. Command Line Toolsが選択されているか確認
4. シミュレータを手動で起動: `open -a Simulator`

### Androidエミュレータが起動しない

**解決策**:
1. Android Studioを起動
2. AVD Manager（Device Manager）でエミュレータを作成
3. エミュレータを起動してから `npm start` → `a` キーを押す

### 環境変数が読み込まれない

**解決策**:
1. `.env` ファイルがプロジェクトルートに存在するか確認
2. `EXPO_PUBLIC_` プレフィックスが付いているか確認
3. 開発サーバーを完全に再起動:
   ```bash
   # ターミナルで Ctrl+C を押してサーバーを停止
   npx expo start -c  # キャッシュをクリアして再起動
   ```

---

## 次のステップ

基本的なセットアップが完了したら、以下の機能を実装してみましょう：

1. **iOS共有拡張機能**: 他のアプリからURLを直接保存
2. **URLメタデータの自動取得**: OGP情報を自動で取得
3. **Gemini API統合**: AI要約機能の実装
4. **ダークモード対応**: システム設定に応じた外観の切り替え

詳細は [README.md](README.md) を参照してください。

---

## サポート

問題が発生した場合は、以下のリソースを参照してください：

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)

ハッピーコーディング！
