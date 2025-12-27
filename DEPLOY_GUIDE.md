# Cloud Functions デプロイガイド

## 前提条件

### 1. Firebaseプランをアップグレード

**重要**: Cloud Functionsで外部API（Gemini）を呼び出すには**Blazeプラン（従量課金）**が必要です。

1. Firebase Consoleを開く: https://console.firebase.google.com/
2. プロジェクトを選択
3. 左下の「Upgrade」または「使用量と請求」→「詳細と設定」
4. 「Blazeプランにアップグレード」をクリック

**無料枠:**
- Cloud Functions: 月200万回の呼び出し
- Cloud Functions: 月40万GB秒の実行時間
- 個人アプリなら通常は無料枠内で収まります

### 2. Firebase CLIのインストール

```bash
# Firebase CLIをグローバルインストール
npm install -g firebase-tools

# ログイン
firebase login
```

### 3. プロジェクトの確認

```bash
# 現在のプロジェクトを確認
firebase projects:list

# 必要に応じてプロジェクトを選択
firebase use --add
```

---

## デプロイ手順

### Step 1: 暗号化キーの設定

APIキーを暗号化するための秘密鍵を設定します。

```bash
# 1. 暗号化キーを生成（32文字以上のランダム文字列）
openssl rand -base64 32

# 出力例:
# 8K9jN2mP5qR7sT1vW3xY6zA4bC8dE0fG2hJ4kL6mN8pQ

# 2. Firebase Secretsに設定
firebase functions:secrets:set ENCRYPTION_KEY

# プロンプトが表示されたら、上記で生成したキーをペースト
# 例: 8K9jN2mP5qR7sT1vW3xY6zA4bC8dE0fG2hJ4kL6mN8pQ
```

**重要**: このキーは絶対に公開しないでください！

### Step 2: Cloud Functionsのデプロイ

```bash
# 1. functionsディレクトリで依存関係をインストール
cd functions
npm install

# 2. ビルドが通ることを確認
npm run build

# 3. プロジェクトルートに戻る
cd ..

# 4. Cloud Functionsをデプロイ
firebase deploy --only functions

# デプロイには数分かかります...
```

### Step 3: Firestoreルールのデプロイ

```bash
# Firestoreセキュリティルールをデプロイ
firebase deploy --only firestore:rules
```

### Step 4: 動作確認

1. アプリを起動
2. 設定画面でGemini APIキーを入力
3. リンク詳細画面で「要約を生成」をテスト

---

## トラブルシューティング

### エラー: "ENCRYPTION_KEY is not set"

```bash
# 暗号化キーが設定されていません
firebase functions:secrets:set ENCRYPTION_KEY
```

### エラー: "Billing account not configured"

Firebaseプランが**Blazeプラン**になっていません。
→ Firebase Consoleでアップグレードしてください

### エラー: "Permission denied"

```bash
# Firebase CLIに再ログイン
firebase logout
firebase login
```

### デプロイが遅い

初回デプロイは5-10分かかることがあります。
2回目以降は変更があった関数のみデプロイされるので高速です。

### 特定の関数のみ再デプロイ

```bash
# summarizeURL関数のみ
firebase deploy --only functions:summarizeURL

# 複数の関数
firebase deploy --only functions:summarizeURL,functions:saveGeminiApiKey
```

---

## デプロイ後の確認

### Cloud Functionsのログを確認

```bash
# リアルタイムでログを表示
firebase functions:log

# 特定の関数のログ
firebase functions:log --only summarizeURL
```

### Firebase Consoleで確認

1. https://console.firebase.google.com/
2. プロジェクトを選択
3. 「Functions」→デプロイされた関数が表示される
4. 「Logs」→実行ログを確認

---

## 費用の目安

### 無料枠（Blazeプラン）

| サービス | 無料枠 |
|---------|--------|
| Cloud Functions呼び出し | 月200万回 |
| Cloud Functions実行時間 | 月40万GB秒 |
| Firestore読み取り | 月5万回 |
| Firestore書き込み | 月2万回 |

### 実際のコスト例

**1日100回の要約実行の場合：**
- 月3,000回の呼び出し
- → **完全無料**（無料枠内）

**1日1,000回の要約実行の場合：**
- 月30,000回の呼び出し
- → **完全無料**（無料枠内）

**月100万回を超えたら：**
- 超過分が課金される
- 100万回あたり$0.40程度

---

## セキュリティチェックリスト

- ✅ ENCRYPTION_KEYを設定した
- ✅ ENCRYPTION_KEYを`.gitignore`に含めた（公開しない）
- ✅ Firestore Rulesをデプロイした
- ✅ Firebase Authenticationが有効
- ✅ 本番環境でテストした

---

## 次のステップ

1. アプリをビルド: `npm run build` または `eas build`
2. ストアに提出

デプロイ完了後、ユーザーは設定画面でAPIキーを再入力する必要があります。
