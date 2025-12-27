# LinkDeck Cloud Functions

LinkDeckのGemini API統合をセキュアに実行するためのCloud Functions

## 概要

ユーザーのGemini APIキーを暗号化してFirestoreに保存し、Cloud Functions経由で安全に要約機能を提供します。

### セキュリティ機能

- **AES-256-GCM暗号化**: ユーザーのAPIキーをFirestoreに暗号化して保存
- **認証チェック**: 全ての関数で Firebase Authentication による認証を必須化
- **Firestore Rules**: クライアントから暗号化キーへの直接アクセスを防止

## デプロイ手順

### 1. Firebase CLIのインストール

```bash
npm install -g firebase-tools
firebase login
```

### 2. 暗号化キーの設定

APIキーを暗号化するための秘密鍵を設定します：

```bash
# 32文字以上のランダムな文字列を生成
openssl rand -base64 32

# Firebase Functions Secretsとして設定
firebase functions:secrets:set ENCRYPTION_KEY
# プロンプトで上記で生成した文字列を入力
```

### 3. Cloud Functionsのデプロイ

```bash
# functionsディレクトリで依存関係をインストール
cd functions
npm install

# ビルド確認
npm run build

# デプロイ
cd ..
firebase deploy --only functions
```

### 4. Firestore Rulesのデプロイ

```bash
firebase deploy --only firestore:rules
```

## 提供される関数

### `saveGeminiApiKey`
ユーザーのGemini APIキーを暗号化してFirestoreに保存

**入力:**
```typescript
{ apiKey: string }
```

**出力:**
```typescript
{ success: boolean }
```

### `removeGeminiApiKey`
ユーザーのGemini APIキーを削除

**出力:**
```typescript
{ success: boolean }
```

### `hasGeminiApiKey`
ユーザーがAPIキーを設定済みかチェック

**出力:**
```typescript
{ hasKey: boolean }
```

### `summarizeURL`
URLのコンテンツを要約

**入力:**
```typescript
{ url: string }
```

**出力:**
```typescript
{ summary: string }
```

## ローカル開発

### エミュレータの起動

```bash
# Firebase Emulatorsをインストール
firebase init emulators

# エミュレータを起動
firebase emulators:start
```

### 環境変数の設定

ローカル開発では `.env` ファイルを使用できます：

```bash
# functions/.env
ENCRYPTION_KEY=your-local-encryption-key-min-32-chars
```

## トラブルシューティング

### ENCRYPTION_KEYエラー

```
Error: ENCRYPTION_KEY is not set
```

**解決方法:**
```bash
firebase functions:secrets:set ENCRYPTION_KEY
```

### デプロイエラー

```bash
# ログを確認
firebase functions:log

# 特定の関数のみ再デプロイ
firebase deploy --only functions:summarizeURL
```

## セキュリティ上の注意

- ENCRYPTION_KEYは絶対に公開しないでください
- `.env`ファイルは`.gitignore`に含めてください
- 本番環境では必ずFirebase Secretsを使用してください
