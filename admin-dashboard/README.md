# LinksDeck Admin Dashboard

LinksDeckの管理画面です。サービスモードの設定や管理機能を提供します。

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

管理画面は**ルートディレクトリの`.env`ファイルをシンボリックリンクで共有**しています。
モバイルアプリと管理画面で同じFirebase設定を使用します。

ルートディレクトリで`.env`ファイルを作成してください：

```bash
# プロジェクトルートに戻る
cd ..

# .env.exampleをコピーして.envを作成
cp .env.example .env

# .envファイルを編集してFirebase設定を入力
# 注意: EXPO_PUBLIC_* と NEXT_PUBLIC_* の両方に同じ値を設定してください
```

シンボリックリンクは自動的に作成されています：
```bash
admin-dashboard/.env -> /home/user/LinksDeck/.env
```

もし削除してしまった場合は、以下のコマンドで再作成できます：
```bash
cd admin-dashboard
ln -sf /home/user/LinksDeck/.env .env
```

### 3. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 管理者ユーザーの設定

### Firebaseコンソールで管理者を設定する

1. Firebase Console を開く
2. Firestore Database を選択
3. `users` コレクションから管理者にしたいユーザードキュメントを開く
4. `role` フィールドを追加し、値を `admin` に設定

例:
```
users/{userId}
  email: "admin@example.com"
  displayName: "Admin User"
  role: "admin"  ← これを追加
  createdAt: ...
```

## 機能

### サービスモード管理

- **サービスモードON/OFF**: トグルスイッチで切り替え
- **メッセージ設定**: ユーザーに表示するメッセージをカスタマイズ
- **機能の無効化**: 個別機能の制御（リンク追加、AI検索など）
- **変更理由の記録**: すべての変更に理由を記録
- **変更履歴の表示**: 誰がいつ何を変更したかを確認

## デプロイ

### Vercelへのデプロイ（推奨）

```bash
# Vercel CLIをインストール
pnpm add -g vercel

# デプロイ
vercel
```

環境変数を設定することを忘れないでください。

### Firebaseホスティングへのデプロイ

```bash
# ビルド
pnpm build

# Firebase CLIでデプロイ
firebase deploy --only hosting:admin
```

## セキュリティ

- Firestoreセキュリティルールにより、管理者のみが設定を変更できます
- すべての変更は履歴として記録されます
- 変更理由が必須となっています

## 開発

### ディレクトリ構成

```
admin-dashboard/
├── app/
│   ├── api/               # API Routes
│   ├── service-mode/      # サービスモード管理ページ
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # トップページ
├── lib/
│   ├── firebase.ts        # Firebase設定
│   └── types.ts           # 型定義
└── components/            # 共通コンポーネント
```

## トラブルシューティング

### 「権限がありません」エラー

- Firestoreセキュリティルールが正しくデプロイされているか確認
- ユーザーに `role: "admin"` が設定されているか確認

### Firebase接続エラー

- `.env`ファイルが正しく設定されているか確認
- Firebase設定が有効か確認
