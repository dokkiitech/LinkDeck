# 管理画面セットアップガイド

## 🚨 重要: Firebase設定が必要です

管理画面を使用するには、Firebaseの設定が必要です。

## 📝 セットアップ手順

### 1. Firebase設定値を取得

Firebase Consoleから以下の情報を取得してください：

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択
3. プロジェクト設定（歯車アイコン） → 「全般」タブ
4. 「マイアプリ」セクションでWebアプリを選択（または新規作成）
5. 以下の値をコピー:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID

### 2. .envファイルに設定を入力

プロジェクトルートの `.env` ファイルを編集：

```bash
# プロジェクトルートで実行
nano .env

# または
vim .env
```

以下のように設定してください（`your-*`の部分を実際の値に置き換える）：

```bash
# モバイルアプリ用（Expo）
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...（実際のAPIキー）
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456

# 管理画面用（Next.js） - ↑と同じ値をコピー
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...（上と同じ値）
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

### 3. 開発サーバーを再起動

```bash
# 管理画面ディレクトリで実行
cd admin-dashboard
pnpm dev
```

### 4. 管理者ユーザーを設定

Firebase Consoleで管理者権限を付与：

1. Firebase Console → Firestore Database
2. `users/{あなたのUID}` ドキュメントを開く
3. フィールドを追加:
   - フィールド名: `role`
   - 型: `string`
   - 値: `admin`
4. 保存

**UID の確認方法:**
- モバイルアプリでログイン後、Firestore Consoleの `users` コレクションで確認できます
- または、Firebase Authentication → Users タブで確認

### 5. ログイン

1. ブラウザで [http://localhost:3000/login](http://localhost:3000/login) を開く
2. 管理者アカウントでログイン
3. サービスモード管理画面にリダイレクトされます

## ❌ トラブルシューティング

### エラー: "Firebase: Error (auth/invalid-api-key)"

**原因:** `.env` ファイルが正しく設定されていない

**解決方法:**
1. `.env` ファイルが存在するか確認: `ls -la .env`
2. 環境変数が正しく設定されているか確認
3. 開発サーバーを再起動: `pnpm dev`

### ログイン画面が表示されない

**解決方法:**
- URLを確認: `http://localhost:3000/login`（末尾に `/login` が必要）

### "管理者権限がありません"

**原因:** ユーザーに `role: 'admin'` が設定されていない

**解決方法:**
- Firebase Console → Firestore → `users/{あなたのUID}` に `role: 'admin'` を追加

## 🔍 環境変数の確認

正しく設定されているか確認するには、ブラウザの開発者ツールのコンソールを確認してください。

設定されていない場合、以下のようなエラーメッセージが表示されます：
```
❌ Firebase環境変数が設定されていません
📝 .envファイルを確認してください
```

## 📚 詳細情報

- [環境変数ドキュメント](../docs/ENV_VARIABLES.md)
- [Firebase設定ガイド](https://firebase.google.com/docs/web/setup)
