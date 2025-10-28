# タスク完了時のチェックリスト

## コード変更後の確認事項

### 1. 型チェック
```bash
# TypeScriptの型エラーがないか確認（暗黙的にExpoが実行）
# エディタでエラーが表示されていないか確認
```

### 2. 開発サーバーの確認
```bash
# 開発サーバーを起動して動作確認
npm start
# または
npx expo start
```

### 3. プラットフォームでの動作確認

**iOS（主要プラットフォーム）**:
```bash
npm run ios
# またはExpo Goアプリで確認
```

**Android（サポート対象）**:
```bash
npm run android
```

**Web（オプション）**:
```bash
npm run web
```

### 4. Firebase関連の変更がある場合

**Firestoreルールの変更**:
```bash
firebase deploy --only firestore:rules
```

**環境変数の変更**:
- `.env`ファイルを更新
- 開発サーバーを再起動
- `app.config.js`に反映されているか確認

### 5. Git コミット前の確認

**変更内容の確認**:
```bash
git status
git diff
```

**適切なコミットメッセージ**:
- `feat:` - 新機能
- `fix:` - バグ修正
- `docs:` - ドキュメント更新
- `style:` - コードスタイルの変更
- `refactor:` - リファクタリング
- `test:` - テスト追加

例：
```bash
git add .
git commit -m "feat: リンク検索機能を追加"
```

### 6. ドキュメント更新

以下のドキュメントが影響を受ける場合は更新：
- `CLAUDE.md` - プロジェクトの実装状況や構造の変更
- `README.md` - ユーザー向けの使い方や機能の変更
- `SETUP_GUIDE.md` - セットアップ手順の変更

### 7. 型定義の更新

新しいデータモデルや型を追加した場合：
- `src/types/index.ts`に型定義を追加
- Firestoreドキュメント型とアプリ型の両方を定義
- JSDocコメントを追加

### 8. 新しい依存関係を追加した場合

```bash
# package.jsonに記録されているか確認
cat package.json

# README.mdに主要な依存関係を記載
```

## 現在未設定のタスク

以下のタスクは、ツールが設定されていないため現在は不要です：

### リント・フォーマット（未設定）
```bash
# 将来的に設定する場合
npm run lint
npm run format
```

### テスト（未設定）
```bash
# 将来的に設定する場合
npm test
npm run test:watch
```

### ビルド/型チェック（Expoが自動実行）
```bash
# 明示的な型チェックコマンドは不要
# Expoが開発サーバー起動時に自動実行
```

## プロダクションビルド前の確認

### ローカルビルドテスト
```bash
# iOS用ビルド
eas build --platform ios --local

# プロダクションビルド
eas build --local --profile production
```

### 環境設定の確認
- Firebase設定が正しいか
- APIキーが正しく設定されているか
- バンドルIDやパッケージ名が正しいか

### アプリ設定の確認
- `app.config.js`のバージョン番号を更新
- iOSのbuildNumberを更新
- スプラッシュ画面やアイコンが正しいか

## トラブルシューティング

### エラーが発生した場合

1. **キャッシュのクリア**:
```bash
rm -rf node_modules
rm -rf .expo
npm install
npx expo start -c
```

2. **Firebaseエラー**:
- `.env`ファイルの内容を確認
- Firebaseコンソールで設定を確認
- ネットワーク接続を確認

3. **型エラー**:
- `@types/react`のバージョンを確認
- `tsconfig.json`の設定を確認
- エディタを再起動

4. **ビルドエラー**:
- `package.json`の依存関係を確認
- iOS/Androidのビルドディレクトリをクリーン
- Expoのキャッシュをクリア
