# Share Extension CI/CD セットアップガイド

GitHub Actions + Fastlane 環境でShare Extensionを統合する方法

## 現在の課題

Fastlaneで`npx expo prebuild --platform ios --clean`を実行すると、毎回iOSプロジェクトが再生成されるため、手動で追加したShare Extensionが消えてしまいます。

## 推奨される解決策

### 方法1: Android優先アプローチ（最も簡単）✅

**現状の実装で既にAndroidは動作します**。iOSは後回しにして、まずはAndroidでShare機能を提供します。

**メリット:**
- 追加設定不要（app.config.jsの変更のみ）
- CI/CDの変更不要
- すぐに使用可能

**実装状況:**
- ✅ `ShareMenuHandler.tsx` 実装済み
- ✅ Android Intent Filters 設定済み
- ✅ GitHub Actions 対応済み

**次のステップ:**
```bash
# Android Development Buildを作成
eas build --profile development --platform android

# または GitHub Actions でビルド（Androidワークフローがあれば）
```

---

### 方法2: ios/ディレクトリをGitで管理（中程度の難易度）

`expo prebuild`を初回のみ実行し、生成された`ios/`ディレクトリをGitで管理する方法です。

#### 手順

1. **ローカルでiOS プロジェクトを生成**

   ```bash
   npx expo prebuild --platform ios
   ```

2. **XcodeでShare Extensionを追加**

   a. Xcodeでプロジェクトを開く
   ```bash
   open ios/LinksDeck.xcworkspace
   ```

   b. File → New → Target → Share Extension

   c. Product Name: `ShareExtension`

   d. Bundle ID: `com.linkdeck.app.ShareExtension`

3. **Share Extension用のProvisioning Profileを作成**

   a. [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list) で新しいApp IDを登録
   - Bundle ID: `com.linkdeck.app.ShareExtension`

   b. Provisioning Profile を作成（Development & Distribution）

   c. Profile をダウンロードして Base64 エンコード
   ```bash
   base64 -i ShareExtension_Profile.mobileprovision -o share_extension_profile_base64.txt
   ```

   d. GitHub Secretsに追加
   - `SHARE_EXTENSION_PROVISION_PROFILE_BASE64`

4. **.gitignore を更新**

   ```bash
   # .gitignoreから以下の行を削除（ios/をGit管理下に入れる）
   # ios/
   ```

5. **ios/ ディレクトリをコミット**

   ```bash
   git add ios/
   git commit -m "Add iOS native project with Share Extension"
   ```

6. **Fastfileを更新**

   `fastlane/Fastfile`を編集して、`--clean`フラグを削除：

   ```ruby
   # Before
   sh("cd .. && npx expo prebuild --platform ios --clean")

   # After
   sh("cd .. && npx expo prebuild --platform ios")
   ```

   Share Extension用のコード署名設定を追加：

   ```ruby
   # メインアプリのコード署名設定の後に追加
   update_code_signing_settings(
     use_automatic_signing: false,
     path: "ios/LinksDeck.xcodeproj",
     targets: ["ShareExtension"],  # Share Extensionターゲット
     team_id: ENV["APPLE_TEAM_ID"],
     bundle_identifier: "com.linkdeck.app.ShareExtension",
     profile_name: ENV["SHARE_EXTENSION_PROVISIONING_PROFILE_SPECIFIER"]
   )
   ```

   `export_options`にShare Extensionを追加：

   ```ruby
   export_options: {
     provisioningProfiles: {
       "com.linkdeck.app" => ENV["PROVISIONING_PROFILE_SPECIFIER"],
       "com.linkdeck.app.ShareExtension" => ENV["SHARE_EXTENSION_PROVISIONING_PROFILE_SPECIFIER"]
     }
   }
   ```

7. **GitHub Actionsワークフローを更新**

   `.github/workflows/ios-preview.yml` と `ios-production.yml` に環境変数を追加：

   ```yaml
   - name: Decode Certificate and Provisioning Profile
     env:
       BUILD_CERTIFICATE_BASE64: ${{ secrets.BUILD_CERTIFICATE_BASE64 }}
       BUILD_PROVISION_PROFILE_BASE64: ${{ secrets.BUILD_PROVISION_PROFILE_BASE64 }}
       SHARE_EXTENSION_PROVISION_PROFILE_BASE64: ${{ secrets.SHARE_EXTENSION_PROVISION_PROFILE_BASE64 }}
     run: |
       echo "$BUILD_CERTIFICATE_BASE64" | base64 --decode > certificate.p12
       echo "$BUILD_PROVISION_PROFILE_BASE64" | base64 --decode > profile.mobileprovision
       echo "$SHARE_EXTENSION_PROVISION_PROFILE_BASE64" | base64 --decode > share_extension_profile.mobileprovision
       echo "BUILD_CERTIFICATE_PATH=$PWD/certificate.p12" >> $GITHUB_ENV
       echo "BUILD_PROVISION_PROFILE_PATH=$PWD/profile.mobileprovision" >> $GITHUB_ENV
       echo "SHARE_EXTENSION_PROVISION_PROFILE_PATH=$PWD/share_extension_profile.mobileprovision" >> $GITHUB_ENV

   - name: Build iOS App
     env:
       # ... existing env vars ...
       SHARE_EXTENSION_PROVISIONING_PROFILE_SPECIFIER: ${{ secrets.SHARE_EXTENSION_PROVISIONING_PROFILE_SPECIFIER }}
   ```

8. **GitHub Secretsに追加**

   - `SHARE_EXTENSION_PROVISION_PROFILE_BASE64`
   - `SHARE_EXTENSION_PROVISIONING_PROFILE_SPECIFIER`

**メリット:**
- 完全な制御が可能
- Share Extensionが確実に含まれる
- CIで自動ビルド可能

**デメリット:**
- ios/ディレクトリのメンテナンスが必要
- マージコンフリクトの可能性
- Expoのアップデートで問題が起きる可能性

---

### 方法3: EAS Buildを使用（推奨・長期的）

Fastlane の代わりに EAS Build を使用すると、Share Extension の設定が簡単になります。

#### 手順

1. **eas.json を更新**

   ```json
   {
     "build": {
       "preview": {
         "ios": {
           "buildConfiguration": "Release",
           "autoIncrement": true,
           "config": "eas-build-pre-install.sh"
         }
       }
     }
   }
   ```

2. **eas-build-pre-install.sh を作成**

   Share Extensionを自動的に追加するスクリプト（複雑なため省略）

3. **GitHub ActionsでEAS Buildを実行**

   ```yaml
   - name: Build with EAS
     run: eas build --platform ios --profile preview --non-interactive
     env:
       EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
   ```

**メリット:**
- Expoの公式ツールチェーン
- 設定が比較的簡単
- 長期的なメンテナンスが楽

**デメリット:**
- 既存のFastlaneセットアップを変更する必要がある
- EAS Buildの料金プランが必要（月$29〜）

---

## 推奨アプローチ

現在の状況を考慮すると、以下の段階的なアプローチを推奨します：

### フェーズ1: Android優先（今すぐ）✅
- 現在の実装でAndroidは動作します
- iOS は URL Scheme（既存の`SharedURLHandler`）で対応

### フェーズ2: iOSディレクトリ管理（必要に応じて）
- Androidのフィードバックを得てから
- 方法2を実装してiOSネイティブShare対応

### フェーズ3: EAS Build移行（長期的）
- ビジネスが成長して予算がついたら
- より持続可能なビルドシステムに移行

---

## 現在のステータス

✅ **実装済み:**
- ShareMenuHandler コンポーネント
- Android設定（app.config.js）
- 基本的な動作確認

⏳ **保留中:**
- iOS Share Extension の完全統合
- CI/CDでの自動ビルド（iOS Share Extension）

📋 **推奨アクション:**
1. まずAndroidでShare機能をリリース
2. ユーザーフィードバックを収集
3. 需要があればiOS Share Extensionを実装

---

## トラブルシューティング

### expo prebuild時にShare Extensionが消える
- `--clean`フラグを削除
- ios/ディレクトリをGitで管理

### CI/CDでShare Extensionのコード署名エラー
- Provisioning Profileが正しく設定されているか確認
- Bundle IDが一致しているか確認
- Fastfileの`export_options`を確認

### Share Extensionが表示されない
- Bundle IDがApple Developer Portalに登録されているか確認
- Provisioning Profileが有効か確認
- Info.plistの設定を確認
