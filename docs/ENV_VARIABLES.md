# 環境変数の管理

LinksDeckプロジェクトでは、モバイルアプリ（React Native/Expo）と管理画面（Next.js）で**同じFirebase設定を共有**しています。

## 📁 ファイル構成

```
LinksDeck/
├── .env                          # 実際の環境変数（Gitignore対象）
├── .env.example                  # 環境変数のテンプレート
└── admin-dashboard/
    └── .env -> /path/to/.env     # シンボリックリンク（ルートの.envを参照）
```

## 🔗 シンボリックリンクによる共有

管理画面の`.env`ファイルは、ルートディレクトリの`.env`への**シンボリックリンク**です。

```bash
admin-dashboard/.env -> /home/user/LinksDeck/.env
```

これにより、**1つの`.env`ファイル**でモバイルアプリと管理画面の両方の設定を管理できます。

## 📝 環境変数の設定方法

### 1. `.env`ファイルの作成

```bash
# プロジェクトルートで実行
cp .env.example .env
```

### 2. Firebase設定の入力

`.env`ファイルを編集し、以下の両方のプレフィックスに**同じ値**を設定します：

```bash
# モバイルアプリ用（Expo）
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# 管理画面用（Next.js） - ↑と同じ値を設定
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. シンボリックリンクの確認

管理画面のシンボリックリンクが正しく設定されているか確認：

```bash
ls -la admin-dashboard/.env
# 出力例: lrwxrwxrwx 1 user user 25 Jan 6 18:17 .env -> /home/user/LinksDeck/.env
```

## 🔧 シンボリックリンクの再作成

もしシンボリックリンクが削除された場合、以下のコマンドで再作成できます：

```bash
cd admin-dashboard
ln -sf $(pwd)/../.env .env
```

または絶対パスで：

```bash
cd admin-dashboard
ln -sf /home/user/LinksDeck/.env .env
```

## 📚 環境変数のプレフィックス

### Expo（モバイルアプリ）

- **プレフィックス**: `EXPO_PUBLIC_*`
- **理由**: Expoはこのプレフィックスで始まる環境変数をクライアント側で利用可能にします
- **読み込み**: `app.config.js` → `expo.extra` → `Constants.expoConfig.extra`

### Next.js（管理画面）

- **プレフィックス**: `NEXT_PUBLIC_*`
- **理由**: Next.jsはこのプレフィックスで始まる環境変数をブラウザに公開します
- **読み込み**: `process.env.NEXT_PUBLIC_*` で直接アクセス

## ⚠️ セキュリティ上の注意

### 公開される情報

`EXPO_PUBLIC_*` と `NEXT_PUBLIC_*` のプレフィックスが付いた環境変数は、**クライアント側（アプリやブラウザ）に公開**されます。

- ✅ Firebase設定（API Key、Project IDなど）は公開してもOK
  - Firebase セキュリティルールで保護されている
  - これらは「公開鍵」のようなもの

- ❌ 秘密情報は絶対に含めないでください
  - サービスアカウントキー
  - プライベートAPIキー
  - データベースパスワード

### サーバーサイド専用の環境変数

プレフィックスなしの環境変数は、サーバーサイドでのみ利用可能です：

```bash
# これはサーバーサイド（Cloud Functions、Next.js API Routes）でのみ利用可能
ENCRYPTION_KEY=secret-key-here
ADMIN_PASSWORD=secret-password
```

## 🔍 トラブルシューティング

### 環境変数が読み込めない

**モバイルアプリの場合**:
```bash
# 開発サーバーを再起動
npx expo start -c  # -c でキャッシュクリア
```

**管理画面の場合**:
```bash
# 開発サーバーを再起動
cd admin-dashboard
pnpm dev
```

### シンボリックリンクが機能しない

Windowsの場合、シンボリックリンクが機能しない可能性があります。その場合は、`.env`ファイルを手動でコピーしてください：

```bash
cp .env admin-dashboard/.env
```

ただし、この場合は設定変更時に両方のファイルを更新する必要があります。

## 📖 関連ドキュメント

- [Expo環境変数ドキュメント](https://docs.expo.dev/guides/environment-variables/)
- [Next.js環境変数ドキュメント](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Firebase Web設定](https://firebase.google.com/docs/web/setup)
