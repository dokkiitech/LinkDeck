# iOS CI/CD セットアップガイド

GitHub ActionsでiOSアプリのビルドと配信を自動化するための設定手順です。

## 概要

- **Preview Build**: PRに`CD`ラベルをつけるとTestFlightにアップロード
- **Production Build**: mainブランチにマージすると自動でApp Storeに提出

## 必要なGitHub Secrets

以下のSecretsをGitHubリポジトリに設定してください：
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### Apple Developer関連

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `APPLE_ID` | Apple IDのメールアドレス | Apple Developer Accountのメールアドレス |
| `APPLE_TEAM_ID` | Apple Developer Team ID | [Apple Developer Account](https://developer.apple.com/account) の Membership セクションで確認 |
| `APP_STORE_CONNECT_TEAM_ID` | App Store Connect Team ID | [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Keys で確認 |

### 証明書とプロビジョニングプロファイル

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `BUILD_CERTIFICATE_BASE64` | 証明書(.p12)のBase64エンコード | 下記「証明書の準備」参照 |
| `P12_PASSWORD` | .p12ファイルのパスワード | 証明書エクスポート時に設定したパスワード |
| `BUILD_PROVISION_PROFILE_BASE64` | プロビジョニングプロファイルのBase64エンコード | 下記「プロビジョニングプロファイルの準備」参照 |
| `PROVISIONING_PROFILE_SPECIFIER` | プロビジョニングプロファイル名 | Xcodeまたは[Apple Developer](https://developer.apple.com/account/resources/profiles/list)で確認 |

### App Store Connect API

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `APP_STORE_CONNECT_API_KEY` | App Store Connect APIキー | [App Store Connect](https://appstoreconnect.apple.com/access/api) → Keys → Generate API Key |

### その他

| Secret名 | 説明 |
|---------|------|
| `KEYCHAIN_PASSWORD` | CI用のキーチェーンパスワード（任意の文字列でOK） |

### Firebase関連（既存のSecrets）

以下のFirebase関連Secretsも必要です：
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## 証明書の準備

### 1. 証明書のエクスポート

macOSのキーチェーンアクセスから：

1. キーチェーンアクセスを開く
2. 左メニューから「ログイン」→「自分の証明書」を選択
3. `Apple Distribution: Your Name (Team ID)` を右クリック
4. 「書き出す」を選択
5. 形式を「個人情報交換 (.p12)」にして保存
6. パスワードを設定（このパスワードを`P12_PASSWORD`に設定）

### 2. Base64エンコード

ターミナルで以下を実行：

```bash
base64 -i /path/to/certificate.p12 | pbcopy
```

クリップボードにコピーされたBase64文字列を`BUILD_CERTIFICATE_BASE64`に設定

## プロビジョニングプロファイルの準備

### 1. プロビジョニングプロファイルのダウンロード

1. [Apple Developer](https://developer.apple.com/account/resources/profiles/list) にアクセス
2. App Store用のプロビジョニングプロファイルをダウンロード
3. または、Xcodeから： `Xcode` → `Settings` → `Accounts` → `Download Manual Profiles`

### 2. Base64エンコード

ターミナルで以下を実行：

```bash
base64 -i /path/to/profile.mobileprovision | pbcopy
```

クリップボードにコピーされたBase64文字列を`BUILD_PROVISION_PROFILE_BASE64`に設定

## App Store Connect API Keyの取得

1. [App Store Connect](https://appstoreconnect.apple.com/access/api) にアクセス
2. `Keys` タブから `Generate API Key` をクリック
3. 名前を入力（例：GitHub Actions）
4. アクセス権限を「App Manager」に設定
5. 生成されたキーをダウンロード（`.p8`ファイル）

**注意**: App Store Connect API Keyは、アプリ特定パスワード（App-Specific Password）で代用できます。
その場合は[Apple ID](https://appleid.apple.com/)からアプリ特定パスワードを生成してください。

## 使い方

### Preview Build（TestFlight）

1. 機能ブランチでPRを作成
2. PRに`CD`ラベルを追加
3. GitHub Actionsが自動でビルド＆TestFlightにアップロード
4. TestFlightで確認

### Production Build（App Store）

1. PRをmainブランチにマージ
2. GitHub Actionsが自動でビルド＆App Storeに提出
3. App Store Connectで審査を待つ

## トラブルシューティング

### ビルドが失敗する

- GitHub Actionsのログを確認
- Secretsが正しく設定されているか確認
- 証明書とプロビジョニングプロファイルの有効期限を確認

### TestFlightにアップロードされない

- Apple IDのアプリ特定パスワードが正しいか確認
- App Store Connect Team IDが正しいか確認

### 証明書が見つからない

- `BUILD_CERTIFICATE_BASE64`と`P12_PASSWORD`が正しいか確認
- macOSのキーチェーンで証明書が有効か確認

## 参考リンク

- [Fastlane Documentation](https://docs.fastlane.tools/)
- [GitHub Actions: Building and testing Xcode](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-swift)
- [Apple Developer: Certificates and Profiles](https://developer.apple.com/account/resources/)
