# iOS共有拡張機能（Share Extension）実装ガイド

## 概要

iOS Share Extensionを使用すると、Safari やその他のアプリからURLを直接LinkDeckに共有できるようになります。

## 前提条件

Share ExtensionはネイティブiOSコードが必要なため、Expo Goでは動作しません。以下のいずれかの方法が必要です：

1. **Development Build（推奨）**: カスタムネイティブコードを含むビルド
2. **Expo Prebuild**: ネイティブプロジェクトを生成してXcodeで編集

## 実装ステップ

### ステップ1: ネイティブプロジェクトの生成

```bash
# ネイティブiOS/Androidプロジェクトを生成
npx expo prebuild

# または、Development Buildを使用する場合
eas build --profile development --platform ios
```

### ステップ2: Xcodeでプロジェクトを開く

```bash
open ios/LinkDeck.xcworkspace
```

### ステップ3: Share Extension Targetの追加

1. Xcodeのプロジェクトナビゲータで、プロジェクトファイル（LinkDeck）を選択
2. 下部の「+」ボタンをクリックして新しいTargetを追加
3. 「Share Extension」を検索して選択
4. 以下の情報を入力：
   - **Product Name**: LinkDeckShareExtension
   - **Organization Identifier**: あなたのBundle ID（例：com.yourcompany.linkdeck）
   - **Bundle Identifier**: com.yourcompany.linkdeck.ShareExtension
   - **Language**: Swift
   - **Activate scheme**: Activate

### ステップ4: Share Extension Info.plist の設定

`ios/LinkDeckShareExtension/Info.plist` を編集して、URL共有のみを許可するように設定：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>LinkDeckに追加</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionAttributes</key>
        <dict>
            <key>NSExtensionActivationRule</key>
            <dict>
                <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
                <integer>1</integer>
            </dict>
        </dict>
        <key>NSExtensionMainStoryboard</key>
        <string>MainInterface</string>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.share-services</string>
    </dict>
</dict>
</plist>
```

### ステップ5: ShareViewController.swift の実装

`ios/LinkDeckShareExtension/ShareViewController.swift` を以下の内容に置き換え：

```swift
import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    private var sharedURL: String?
    private let appGroupID = "group.com.yourcompany.linkdeck" // あなたのApp Group IDに変更

    override func viewDidLoad() {
        super.viewDidLoad()

        // 共有されたURLを取得
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let itemProvider = extensionItem.attachments?.first else {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }

        // URLの取得を試みる
        if itemProvider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] (item, error) in
                if let url = item as? URL {
                    self?.sharedURL = url.absoluteString
                    DispatchQueue.main.async {
                        self?.saveURLAndClose()
                    }
                } else {
                    self?.closeExtension()
                }
            }
        } else {
            self.closeExtension()
        }
    }

    private func saveURLAndClose() {
        guard let urlString = sharedURL else {
            closeExtension()
            return
        }

        // App Groupを使用してメインアプリとデータを共有
        if let userDefaults = UserDefaults(suiteName: appGroupID) {
            var pendingURLs = userDefaults.stringArray(forKey: "pendingURLs") ?? []
            pendingURLs.append(urlString)
            userDefaults.set(pendingURLs, forKey: "pendingURLs")
            userDefaults.synchronize()

            // 成功メッセージを表示
            showSuccessAlert()
        } else {
            closeExtension()
        }
    }

    private func showSuccessAlert() {
        let alert = UIAlertController(
            title: "保存しました",
            message: "URLをLinkDeckに追加しました",
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            self?.closeExtension()
        })

        present(alert, animated: true)
    }

    private func closeExtension() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
```

### ステップ6: App Group の設定

Share Extensionとメインアプリでデータを共有するために、App Groupを設定します。

1. **Apple Developer Center での設定**:
   - https://developer.apple.com にアクセス
   - Certificates, Identifiers & Profiles → Identifiers
   - メインアプリのBundle IDを選択
   - App Groupsを有効化
   - 新しいApp Groupを作成（例：`group.com.yourcompany.linkdeck`）

2. **Xcodeでの設定**:
   - メインアプリのTarget → Signing & Capabilities
   - 「+ Capability」をクリック
   - 「App Groups」を追加
   - 作成したApp Group IDを選択
   - Share Extension Targetにも同じApp Groupを追加

### ステップ7: メインアプリでの共有URL処理

`App.tsx` または適切なエントリーポイントで、共有されたURLを処理：

```typescript
import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// App Groupから共有されたURLを取得（ネイティブモジュールが必要）
// または、アプリ起動時にApp Groupのデータを確認

const usePendingURLs = () => {
  useEffect(() => {
    const checkPendingURLs = async () => {
      if (Platform.OS === 'ios') {
        // ここでApp Groupから保留中のURLを取得
        // ネイティブモジュールまたはreact-native-shared-group-preferencesを使用
        // 取得したURLをFirestoreに保存し、App Groupから削除
      }
    };

    checkPendingURLs();
  }, []);
};
```

### ステップ8: ネイティブモジュールの作成（オプション）

App Groupのデータにアクセスするためのネイティブモジュールを作成：

`ios/LinkDeck/SharedGroupManager.swift`:

```swift
import Foundation
import React

@objc(SharedGroupManager)
class SharedGroupManager: NSObject {

  private let appGroupID = "group.com.yourcompany.linkdeck"

  @objc
  func getPendingURLs(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    if let userDefaults = UserDefaults(suiteName: appGroupID) {
      let urls = userDefaults.stringArray(forKey: "pendingURLs") ?? []
      resolve(urls)
    } else {
      reject("ERROR", "Failed to access App Group", nil)
    }
  }

  @objc
  func clearPendingURLs(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    if let userDefaults = UserDefaults(suiteName: appGroupID) {
      userDefaults.set([], forKey: "pendingURLs")
      userDefaults.synchronize()
      resolve(true)
    } else {
      reject("ERROR", "Failed to access App Group", nil)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
```

`ios/LinkDeck/SharedGroupManager.m`:

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SharedGroupManager, NSObject)

RCT_EXTERN_METHOD(getPendingURLs:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearPendingURLs:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

### ステップ9: TypeScriptでのネイティブモジュール利用 ✅ 実装済み

**実装済みファイル**: `src/services/sharedGroup.ts`

このファイルは既に実装されています。以下の機能を提供します：

- `getPendingSharedURLs()`: App Groupから保留中の共有URLを取得
- `clearPendingSharedURLs()`: 処理済みURLをクリア
- `isShareExtensionAvailable()`: Share Extension機能が利用可能かチェック

### ステップ10: アプリ起動時の処理 ✅ 実装済み

**実装済みファイル**:
- `src/components/SharedURLHandler.tsx`
- `src/navigation/AppNavigator.tsx`

`SharedURLHandler`コンポーネントが実装されており、以下の機能を提供します：

- アプリ起動時に自動的に共有URLをチェック
- バックグラウンドからフォアグラウンドに戻った時にチェック
- URLメタデータの自動取得
- Firestoreへの自動保存
- 処理結果の通知

このコンポーネントは`AppNavigator`に統合されており、ユーザーがログイン中のみ動作します。

**使用例（既に統合済み）**:

```typescript
// src/navigation/AppNavigator.tsx
import SharedURLHandler from '../components/SharedURLHandler';

const AppNavigator: React.FC = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user && <SharedURLHandler />}
      {/* ...rest of navigation */}
    </NavigationContainer>
  );
};
```

**処理フロー**:
1. Share Extensionでユーザーが他アプリからURLを共有
2. URLがApp Groupの`UserDefaults`に保存される
3. LinkDeckアプリを開く（またはフォアグラウンドに戻す）
4. `SharedURLHandler`が自動的にURLを検出
5. メタデータを取得してFirestoreに保存
6. 成功通知を表示

## 実装状況まとめ

### ✅ 完了している部分（React Native/TypeScript側）

- **ステップ9**: TypeScriptでのネイティブモジュール利用 → `src/services/sharedGroup.ts`
- **ステップ10**: アプリ起動時の共有URL処理 → `src/components/SharedURLHandler.tsx`

これらのファイルは既に実装されており、Share Extension（ネイティブ側）が実装されれば自動的に動作します。

### ⚠️ 未実装の部分（ネイティブiOS側）

以下のステップは、Xcodeでのネイティブ開発が必要です：

- **ステップ1〜6**: Share Extension Targetの作成とSwiftコードの実装
- **ステップ7**: App Groupの設定
- **ステップ8**: ネイティブモジュール（SharedGroupManager）のSwift実装

これらを実装するには、`npx expo prebuild`を実行してネイティブプロジェクトを生成する必要があります。

## 簡易実装（Development Build不要）

完全なShare Extensionの代わりに、以下の代替案も検討できます：

### 代替案1: Deep Linkingを使用

Safariのブックマークレットを使用してURLをアプリに渡す方法：

1. `app.json` でDeep Linkingを設定
2. ブックマークレットを作成してURLスキームを呼び出す

### 代替案2: Clipboardモニタリング

アプリがフォアグラウンドになった時にクリップボードをチェック：

```typescript
import Clipboard from '@react-native-clipboard/clipboard';
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', async (nextAppState) => {
    if (nextAppState === 'active') {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent.startsWith('http://') || clipboardContent.startsWith('https://')) {
        // URLとして認識し、追加するか確認
      }
    }
  });

  return () => subscription.remove();
}, []);
```

## トラブルシューティング

### App Groupにアクセスできない
- Apple Developer CenterでApp Groupが正しく設定されているか確認
- XcodeでProvisioning Profileが最新か確認
- Bundle IDが正確に一致しているか確認

### Share Extensionが表示されない
- Info.plistの`NSExtensionActivationRule`が正しく設定されているか確認
- iOSデバイスまたはシミュレータを再起動
- アプリを削除して再インストール

### ビルドエラー
- Xcodeでクリーン（Cmd + Shift + K）して再ビルド
- `node_modules`と`ios/Pods`を削除して再インストール

## 参考リンク

- [Apple Documentation: App Extensions](https://developer.apple.com/app-extensions/)
- [Share Extension Tutorial](https://developer.apple.com/documentation/uikit/inter-process_communication/allowing_apps_and_websites_to_link_to_your_content)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [React Native Native Modules](https://reactnative.dev/docs/native-modules-ios)
