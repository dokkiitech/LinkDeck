# EAS Build ガイド

LinksDeckアプリをEAS（Expo Application Services）でビルドする手順を説明します。

## 前提条件

### 1. Expo アカウント
- https://expo.dev でアカウントを作成
- 無料プランでも利用可能

### 2. EAS CLI のインストール

```bash
npm install -g eas-cli
```

### 3. ログイン

```bash
eas login
```

## 初回セットアップ

### 1. プロジェクトの設定

```bash
# EASプロジェクトを初期化（既に設定済みの場合はスキップ）
eas build:configure
```

### 2. Firebase設定ファイルの準備

#### iOS用
`google-services.json` (Android) と `GoogleService-Info.plist` (iOS) をプロジェクトルートに配置

**重要**: これらのファイルは `.gitignore` に含めて、Gitにコミットしないでください。

## ビルドコマンド

### iOS ビルド

#### 開発ビルド（シミュレータ用）
```bash
eas build --platform ios --profile development
```

#### プレビュービルド（実機テスト用）
```bash
eas build --platform ios --profile preview
```

#### プロダクションビルド（App Store提出用）
```bash
eas build --platform ios --profile production
```

### Android ビルド

#### 開発ビルド（APK）
```bash
eas build --platform android --profile development
```

#### プレビュービルド（APK、実機テスト用）
```bash
eas build --platform android --profile preview
```

#### プロダクションビルド（AAB、Google Play提出用）
```bash
eas build --platform android --profile production
```

### 両方のプラットフォームを同時にビルド

```bash
eas build --platform all --profile production
```

## ビルドプロファイルの説明

### development
- 開発用ビルド
- Expo Dev Clientが含まれる
- デバッグ機能が有効
- iOSシミュレータで実行可能

### preview
- 内部テスト用ビルド
- リリース設定だがストアには提出しない
- TestFlightやInternal Testingで配布可能

### production
- ストア提出用の最終ビルド
- 最適化とコード署名が適用される
- iOS: `.ipa` ファイル
- Android: `.aab` (App Bundle) ファイル

## ビルド後の手順

### 1. ビルドステータスの確認

```bash
eas build:list
```

または、Expo Dashboard（https://expo.dev）で確認

### 2. ビルドのダウンロード

ビルドが完了したら、Expo Dashboardからダウンロードリンクが提供されます。

### 3. 実機へのインストール（プレビュービルド）

#### iOS
- TestFlightを使用
- または、Development Profileで署名したビルドを直接インストール

#### Android
- ダウンロードしたAPKを実機に転送してインストール
- または、Internal Testing トラックにアップロード

## ストアへの提出

### iOS（App Store）

```bash
eas submit --platform ios
```

必要な情報：
- Apple ID
- App-specific password
- App Store Connect API Key（推奨）

### Android（Google Play）

```bash
eas submit --platform android
```

必要な情報：
- Google Play Service Account Key (JSON)

## 証明書とプロビジョニング

### 自動管理（推奨）

EASが自動的に証明書とプロビジョニングプロファイルを管理します。

```bash
# 証明書の確認
eas credentials
```

### 手動管理

既存の証明書を使用する場合：

```bash
eas credentials --platform ios
# または
eas credentials --platform android
```

## トラブルシューティング

### ビルドエラー

#### Firebase設定が見つからない
- `google-services.json` と `GoogleService-Info.plist` がプロジェクトルートにあるか確認
- `app.json` で正しく参照されているか確認

#### 証明書エラー
```bash
# 証明書をリセット
eas credentials --platform ios
# "Remove all credentials" を選択
```

#### キャッシュのクリア
```bash
# ローカルキャッシュをクリア
eas build:list --limit 1
```

### ビルドログの確認

Expo Dashboardでビルドログを確認するか：

```bash
# 最新のビルドのログを表示
eas build:view
```

## 環境変数の設定

本番環境の秘密情報（APIキーなど）を設定する場合：

1. Expo Dashboardで環境変数を設定
2. または、`eas.json` で設定：

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com"
      }
    }
  }
}
```

**重要**: `EXPO_PUBLIC_` プレフィックスを付けた環境変数のみクライアントで利用可能です。

## よくある質問

### Q: ビルドにどのくらい時間がかかりますか？
A: 通常5〜15分程度。初回ビルドは依存関係のダウンロードがあるため時間がかかります。

### Q: 無料プランでビルドできますか？
A: はい。無料プランでも毎月一定数のビルドが可能です（制限あり）。

### Q: Share Extensionを含むビルドは？
A: Share Extensionを追加する場合は、まず `npx expo prebuild` でネイティブプロジェクトを生成し、その後EAS Buildを実行してください。

### Q: Development Buildとは？
A: ネイティブコードを含むカスタムExpoクライアントです。Share Extensionなどのネイティブモジュールを使用する場合に必要です。

## 参考リンク

- [EAS Build公式ドキュメント](https://docs.expo.dev/build/introduction/)
- [EAS Submit公式ドキュメント](https://docs.expo.dev/submit/introduction/)
- [証明書管理](https://docs.expo.dev/app-signing/managed-credentials/)
- [環境変数](https://docs.expo.dev/build-reference/variables/)

## クイックリファレンス

```bash
# 最も一般的なコマンド

# iOS本番ビルド
eas build --platform ios --profile production

# Android本番ビルド
eas build --platform android --profile production

# ビルド一覧
eas build:list

# ストア提出
eas submit --platform ios
eas submit --platform android

# プロジェクト情報
eas project:info

# ログイン状態確認
eas whoami
```
