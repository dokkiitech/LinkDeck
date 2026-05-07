# LinksDeck メンテナンスモード管理画面

メンテナンスモードを切り替えるためのWeb管理画面です。

## セットアップ

1. 依存パッケージのインストール:
```bash
npm install
# または
pnpm install
```

2. 環境変数の設定:
`.env.example`を`.env`にコピーして、Firebase設定とAPI URLを入力してください。

```bash
cp .env.example .env
```

3. 開発サーバーの起動:
```bash
npm run dev
# または
pnpm dev
```

ブラウザで `http://localhost:3001` にアクセスしてください。

## 使い方

1. Firebase Authenticationで登録したメールアドレスとパスワードでログイン
2. 現在のメンテナンスモード状態を確認
3. メンテナンスモードに切り替える場合は、理由を入力して「メンテナンスモードに切り替え」ボタンをクリック
4. 通常運用に戻す場合は、「通常運用に戻す」ボタンをクリック

## ビルド

本番用にビルドする場合:
```bash
npm run build
# または
pnpm build
```

ビルドされたファイルは `dist` ディレクトリに出力されます。

## デプロイ

Vercel、Netlify、Firebase Hostingなど、静的サイトホスティングサービスにデプロイできます。

### Firebase Hostingへのデプロイ例:
```bash
npm run build
firebase deploy --only hosting:admin
```
