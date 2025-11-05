# LinksDeck ビルドガイド

## 環境変数の設定

### 1. .envファイルの作成

プロジェクトルートに`.env`ファイルを作成し、Firebase設定を記入してください:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 2. 環境変数の仕組み

- `app.config.js`が`.env`ファイルを読み込み、`expo.extra`に環境変数を埋め込みます
- ビルド時に環境変数がネイティブコードに埋め込まれます
- アプリ内では`Constants.expoConfig.extra`から環境変数にアクセスできます

## iOSローカルビルド

### 前提条件

- macOS環境
- Xcode 15以降がインストールされている
- CocoaPodsがインストールされている
- EAS CLIがインストールされている (`npm install -g eas-cli`)
- Apple Developer Programアカウント

### ビルドコマンド

#### 1. 開発ビルド（Development Build）

```bash
# シミュレータ用
eas build --profile development --platform ios --local

# 実機用（要Apple Developer Program）
eas build --profile preview --platform ios --local
```

#### 2. プロダクションビルド

```bash
eas build --profile production --platform ios --local
```

### ビルドプロファイル

`eas.json`で定義されているビルドプロファイル:

- **development**: 開発用、シミュレータ向け、デバッグモード
- **preview**: プレビュー用、実機向け、リリースモード
- **production**: 本番用、App Store提出向け

### トラブルシューティング

#### 環境変数が読み込まれない

1. `.env`ファイルがプロジェクトルートに存在することを確認
2. `app.config.js`が正しく環境変数を読み込んでいることを確認:
   ```bash
   node -e "
   const dotenv = require('dotenv');
   dotenv.config();
   const config = require('./app.config.js');
   console.log('Project ID:', config.expo.extra.firebaseProjectId);
   "
   ```
3. 既存のビルドキャッシュをクリア:
   ```bash
   rm -rf ios android
   npx expo prebuild --clean
   ```

#### ビルドエラー

1. 依存関係を再インストール:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. CocoaPodsを再インストール:
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```

3. Xcodeのキャッシュをクリア:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

#### Firebase接続エラー

アプリを起動して、コンソールログで以下を確認:
```
Firebase Config: {
  apiKey: 'AIzaSyD__9...',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id'
}
```

すべて`NOT SET`と表示される場合、環境変数が読み込まれていません。

## 検証方法

### 1. 開発サーバーでテスト

```bash
npx expo start
```

アプリを起動して、コンソールログでFirebase設定が正しく表示されることを確認します。

### 2. シミュレータでテスト

```bash
# iOS Simulator
npx expo run:ios
```

### 3. 実機でテスト

1. EASでビルド:
   ```bash
   eas build --profile preview --platform ios --local
   ```

2. 生成された`.ipa`ファイルをTestFlightまたは直接インストール

## 注意事項

- `.env`ファイルはGit管理に含めないでください（`.gitignore`で除外済み）
- 環境変数を変更した場合、アプリを再ビルドする必要があります
- `app.json`は`app.config.js`が優先されるため、使用されません

## 参考資料

- [Expo環境変数ガイド](https://docs.expo.dev/guides/environment-variables/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Firebase Configuration](https://firebase.google.com/docs/web/setup)
