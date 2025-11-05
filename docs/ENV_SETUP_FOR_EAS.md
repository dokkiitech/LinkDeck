# EAS Build用の環境変数セットアップガイド

EAS Buildで`.env`ファイルの環境変数を使用する方法を説明します。

## 概要

LinksDeckアプリは、ビルド時にFirebaseの設定情報を環境変数から読み取ります。
EAS Buildでは、以下の2つの方法で環境変数を設定できます。

## 方法1: Expo Dashboardで設定（推奨）

### ステップ1: Expo Dashboardにアクセス

1. https://expo.dev にアクセスしてログイン
2. LinksDeckプロジェクトを選択
3. 左サイドバーから「Secrets」を選択

### ステップ2: 環境変数を追加

以下の環境変数を1つずつ追加します：

```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

各変数に対して：
1. 「Create a new secret」をクリック
2. 変数名を入力（例：`EXPO_PUBLIC_FIREBASE_API_KEY`）
3. 値を入力（Firebaseコンソールから取得）
4. 「Save」をクリック

### メリット
- セキュア（秘密情報がGitにコミットされない）
- チームメンバー間で共有可能
- プロファイル別に異なる値を設定可能

## 方法2: eas secretコマンドで設定

コマンドラインから環境変数を設定できます。

```bash
# 1つずつ設定
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-auth-domain"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-storage-bucket"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your-sender-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your-app-id"

# 設定した環境変数を確認
eas secret:list
```

## eas.jsonの設定

`eas.json`には既に環境変数の設定が含まれています：

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_API_KEY": "$EXPO_PUBLIC_FIREBASE_API_KEY",
        "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN": "$EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
        ...
      }
    }
  }
}
```

この設定により、EAS Secretsから環境変数が読み込まれます。

## iOS ビルド番号の自動更新

`eas.json`の各プロファイルに`"autoIncrement": true`が設定されており、ビルドごとに自動的にビルド番号が増加します。

### 初期設定

`app.json`に初期ビルド番号が設定されています：

```json
{
  "expo": {
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

### 動作

- 最初のビルド: `1`
- 2回目のビルド: `2`
- 3回目のビルド: `3`
- ...

ビルド番号はEASのクラウド側で管理され、自動的にインクリメントされます。

## ローカル開発用の.env

ローカル開発では`.env`ファイルを使用します：

```bash
# .env（プロジェクトルートに配置）
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**重要**: `.env`ファイルは`.gitignore`に含めてください。

## トラブルシューティング

### ビルド時に環境変数が読み込まれない

1. Expo Dashboardで環境変数が正しく設定されているか確認
2. 変数名が正確か確認（タイポがないか）
3. `eas.json`の`env`セクションが正しいか確認

```bash
# 環境変数を確認
eas secret:list
```

### 環境変数を削除・更新

```bash
# 削除
eas secret:delete --name EXPO_PUBLIC_FIREBASE_API_KEY

# 再作成（更新）
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "new-value"
```

### ビルドログで環境変数を確認

ビルドログでは、環境変数の値は`***`で隠されます。これは正常な動作です。

```
Environment variables:
  EXPO_PUBLIC_FIREBASE_API_KEY: ***
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: ***
```

## セキュリティのベストプラクティス

1. **秘密情報をGitにコミットしない**
   - `.env`は`.gitignore`に追加
   - `eas.json`には実際の値を書かない（`$VAR_NAME`形式で参照）

2. **EXPO_PUBLIC_ プレフィックスを理解する**
   - `EXPO_PUBLIC_`付きの環境変数は、クライアント側（アプリ内）で利用可能
   - アプリバンドルに含まれるため、完全に秘密にはできない
   - APIキーなど、クライアント側で必要な情報に使用

3. **本当に秘密にすべき情報**
   - バックエンドAPIの秘密鍵などは、サーバーサイドで管理
   - クライアント側の環境変数には含めない

## 参考リンク

- [EAS Secrets公式ドキュメント](https://docs.expo.dev/build-reference/variables/)
- [Environment Variables in Expo](https://docs.expo.dev/guides/environment-variables/)
- [eas.json Configuration](https://docs.expo.dev/build/eas-json/)

## クイックリファレンス

```bash
# 環境変数の設定
eas secret:create --scope project --name VAR_NAME --value "value"

# 環境変数の一覧表示
eas secret:list

# 環境変数の削除
eas secret:delete --name VAR_NAME

# ビルド実行（環境変数が自動的に適用される）
eas build --platform ios --profile production
```
