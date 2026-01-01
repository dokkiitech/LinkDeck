# react-native-share-menu セットアップガイド

このドキュメントでは、react-native-share-menuを使用して他のアプリからLinksDeckへリンクを共有する機能のセットアップ方法を説明します。

## 概要

`react-native-share-menu`を使用することで、SafariやChromeなどの他のアプリの共有メニューからLinksDeckへ直接リンクを保存できます。

## 実装済みの内容

- ✅ `ShareMenuHandler.tsx` コンポーネントの実装
- ✅ Android用のIntent Filter設定（app.config.js）
- ✅ 共有データの処理ロジック

## Android セットアップ

Androidの設定は`app.config.js`に既に追加されています：

```javascript
intentFilters: [
  {
    action: "SEND",
    data: [{ mimeType: "text/plain" }],
    category: ["DEFAULT"]
  },
  {
    action: "SEND_MULTIPLE",
    data: [{ mimeType: "text/plain" }],
    category: ["DEFAULT"]
  }
]
```

### Android ビルド手順

1. 開発ビルドを作成：
   ```bash
   eas build --profile development --platform android
   ```

2. アプリをインストール後、他のアプリ（ブラウザなど）から「共有」を選択し、LinksDeckを選択してURLを共有できます。

## iOS セットアップ

iOSで共有メニュー機能を有効にするには、Share Extensionの設定が必要です。

### 前提条件

- Expo Dev Client（`expo-dev-client`）がインストール済み（✅ 済み）
- Apple Developer アカウント

### iOS セットアップ手順

1. **ネイティブプロジェクトを生成**

   ```bash
   npx expo prebuild
   ```

   これにより`ios/`および`android/`ディレクトリが生成されます。

2. **Xcodeでプロジェクトを開く**

   ```bash
   open ios/LinksDeck.xcworkspace
   ```

3. **Share Extension ターゲットを追加**

   a. Xcodeで File → New → Target を選択

   b. "Share Extension" を選択して Next

   c. Product Name: `ShareExtension` と入力

   d. Bundle Identifier: `com.linkdeck.app.ShareExtension`

   e. Finish をクリック

4. **ShareExtension の Info.plist を編集**

   `ios/ShareExtension/Info.plist` を開き、以下を確認：

   ```xml
   <key>NSExtension</key>
   <dict>
       <key>NSExtensionAttributes</key>
       <dict>
           <key>NSExtensionActivationRule</key>
           <dict>
               <key>NSExtensionActivationSupportsText</key>
               <true/>
               <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
               <integer>1</integer>
           </dict>
       </dict>
       <key>NSExtensionMainStoryboard</key>
       <string>MainInterface</string>
       <key>NSExtensionPointIdentifier</key>
       <string>com.apple.share-services</string>
   </dict>
   ```

5. **ShareExtension の ShareViewController を編集**

   `ios/ShareExtension/ShareViewController.m` (または `.swift`) を編集して、
   メインアプリにデータを渡すコードを追加します。

   詳細は react-native-share-menu の公式ドキュメントを参照：
   https://github.com/meedan/react-native-share-menu#ios-setup

6. **App Groups を設定（オプション）**

   Share Extension とメインアプリ間でデータを共有する場合、App Groups の設定が必要です。

7. **ビルドとテスト**

   ```bash
   eas build --profile development --platform ios
   ```

## 使用方法

### ユーザー向け手順

1. Safari、Chrome、またはその他のアプリでURLを表示
2. 共有ボタンをタップ
3. アプリリストから「LinksDeck」を選択
4. URLが自動的にLinksDeckに保存されます

### 動作確認

- アプリがフォアグラウンドにない状態で共有した場合、アプリが起動してURLを保存します
- アプリが既に起動している場合、バックグラウンドでURLを保存します
- 保存が完了すると、確認のアラートが表示されます

## トラブルシューティング

### Android

**問題**: 共有メニューにLinksDeckが表示されない

**解決策**:
- アプリを完全に削除して再インストール
- `app.config.js`の`intentFilters`設定を確認
- 開発ビルド（`eas build`）を使用していることを確認

### iOS

**問題**: 共有メニューにLinksDeckが表示されない

**解決策**:
- Share Extension ターゲットが正しく設定されているか確認
- Bundle Identifier が正しいか確認
- Info.plist の設定を確認
- デバイスを再起動

**問題**: Share Extension からメインアプリにデータが渡らない

**解決策**:
- App Groups が正しく設定されているか確認
- URL Scheme（`linkdeck://`）が正しく設定されているか確認

## 参考資料

- [react-native-share-menu GitHub](https://github.com/meedan/react-native-share-menu)
- [Expo Dev Client ドキュメント](https://docs.expo.dev/development/introduction/)
- [iOS Share Extension ガイド](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/Share.html)

## 注意事項

- Expo Go では動作しません。必ず Development Build または Production Build を使用してください。
- iOS の Share Extension は複雑な設定が必要なため、まずは Android で動作確認することをお勧めします。
- 本番環境にデプロイする前に、必ず実機でテストしてください。
