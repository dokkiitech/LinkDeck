# 推奨コマンド

## 開発環境

### システム情報
- **OS**: macOS (Darwin 25.0.0)
- **Node.js**: v20.18.3 (nvmで管理)
- **npm**: 11.5.1
- **Git**: 2.50.1

## よく使うコマンド

### 開発サーバー
```bash
# 開発サーバーの起動
npm start

# キャッシュクリアして起動
npx expo start -c

# iOSシミュレータで起動
npm run ios

# Androidエミュレータで起動
npm run android

# Web版で起動
npm run web
```

### 依存関係管理
```bash
# 依存関係のインストール
npm install

# 特定のパッケージを追加
npm install <package-name>

# 依存関係の更新
npm update

# node_modulesとキャッシュのクリア
rm -rf node_modules
npm install
npx expo start -c
```

### Firebase関連
```bash
# Firebase CLIのインストール
npm install -g firebase-tools

# Firebaseログイン
firebase login

# Firestoreルールのデプロイ
firebase deploy --only firestore:rules

# プロジェクトの選択
firebase use --add
```

### Expo Build（ローカル）
```bash
# iOS用ローカルビルド
eas build --platform ios --local

# プロダクションビルド（ローカル）
eas build --local --profile production
```

### Git操作
```bash
# 現在の状態確認
git status

# 変更をステージング
git add .

# コミット
git commit -m "feat: 機能の説明"

# プッシュ
git push origin main

# ブランチ作成と切り替え
git checkout -b feature/new-feature

# リモートの変更を取得
git pull origin main
```

### ファイル検索（Darwin特有のコマンド）
```bash
# ファイル名で検索
find . -name "*.tsx"

# ファイル内容で検索（grepを使用）
grep -r "searchTerm" src/

# ディレクトリ一覧
ls -la

# ツリー表示（brewでインストールが必要）
tree -L 2 src/
```

## トラブルシューティングコマンド

### Firebase接続エラー時
```bash
# 環境変数の確認
cat .env

# 開発サーバーの再起動
# Ctrl+Cで停止してから
npm start
```

### ビルドエラー時
```bash
# 完全なクリーンアップ
rm -rf node_modules
rm -rf .expo
rm -rf ios/build
rm -rf android/build
npm install
npx expo start -c
```

### TypeScript型エラー時
```bash
# TypeScriptバージョンの確認
npm list typescript

# 型定義パッケージの確認
npm list @types/react

# キャッシュのクリア
npx tsc --build --clean
```

## 現在未設定のツール

以下のツールは現在プロジェクトに設定されていません：

### リント・フォーマット
- **ESLint**: 未設定
- **Prettier**: 未設定

将来的に追加する場合：
```bash
# ESLintのインストール
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Prettierのインストール
npm install --save-dev prettier eslint-config-prettier

# 実行コマンド（設定後）
npm run lint
npm run format
```

### テスト
- **Jest**: 未設定
- **React Native Testing Library**: 未設定

将来的に追加する場合：
```bash
# テストツールのインストール
npm install --save-dev jest @testing-library/react-native @types/jest

# 実行コマンド（設定後）
npm test
npm run test:watch
npm run test:coverage
```

## エントリーポイント

- **メインエントリー**: `index.ts`
- **アプリエントリー**: `App.tsx`
- **設定ファイル**: `app.config.js`

## 環境変数の管理

環境変数は`.env`ファイルで管理されています。新しい環境変数を追加する場合：

1. `.env`ファイルに`EXPO_PUBLIC_`プレフィックス付きで追加
2. `app.config.js`の`extra`セクションに追加
3. `src/config/firebase.ts`等で使用

例：
```env
EXPO_PUBLIC_NEW_VAR=value
```
