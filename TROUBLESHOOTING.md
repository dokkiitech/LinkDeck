# 🔧 LinkDeck トラブルシューティングガイド

## 🚨 よくあるエラーと解決方法

---

### エラー: "Missing or insufficient permissions"

```
Error loading links: [FirebaseError: Missing or insufficient permissions.]
```

#### 原因
- Firestoreセキュリティルールが設定されていない
- セキュリティルールが公開されていない
- ログインしていない

#### 解決方法

1. **Firestoreセキュリティルールを設定**
   - [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)の手順に従う
   - Firebase Console → Firestore Database → ルール
   - セキュリティルールをコピー＆ペースト
   - **「公開」ボタンをクリック**（重要！）

2. **アプリを再起動**
   - Expo Goを完全に終了
   - 再度起動

3. **ログイン状態を確認**
   - アプリでログインしているか確認
   - ログアウトして再ログイン

---

### エラー: "Unsupported field value: undefined"

```
Error adding link: [FirebaseError: Unsupported field value: undefined]
```

#### 原因
- Firestoreに`undefined`値を保存しようとしている

#### 解決方法

✅ **既に修正済み**: `src/services/firestore.ts`を更新しました

1. **アプリを再起動**
   - Metro Bundlerで `r` キーを押してリロード
   - または Expo Goを再起動

2. **キャッシュをクリア**
   ```bash
   # ターミナルで開発サーバーを停止（Ctrl+C）
   npx expo start -c
   ```

---

### エラー: "APIキーが無効です"

```
エラー: APIキーが無効です。正しいキーを入力してください。
```

#### 原因
- Gemini APIキーが正しくない
- APIキーが無効化されている
- ネットワーク接続の問題

#### 解決方法

1. **新しいAPIキーを取得**
   - [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
   - 新しいAPIキーを生成

2. **設定画面で更新**
   - 設定画面を開く
   - 既存のAPIキーを削除
   - 新しいAPIキーを保存

3. **APIキーの形式を確認**
   - APIキーは`AIza...`で始まる長い文字列
   - スペースや改行が入っていないか確認

---

### エラー: "要約の生成に失敗しました"

```
エラー: 要約の生成に失敗しました
```

#### 原因
- URLのコンテンツが取得できない（CORS、認証など）
- Gemini APIのレート制限
- ネットワーク接続の問題

#### 解決方法

1. **別のURLで試す**
   - シンプルなブログ記事やニュースサイト
   - 推奨: Wikipedia、技術ブログなど

2. **時間を置いて再試行**
   - Gemini APIのレート制限の可能性
   - 数分待ってから再度試す

3. **ネットワーク接続を確認**
   - WiFiまたはモバイルデータが有効か確認
   - 別のネットワークで試す

---

### エラー: "認証エラー"

```
エラー: auth/invalid-email
エラー: auth/wrong-password
```

#### 原因
- メールアドレスまたはパスワードが間違っている
- Firebase Authenticationが有効化されていない

#### 解決方法

1. **Firebase Authentication を有効化**
   - Firebase Console → Authentication → Sign-in method
   - 「メール/パスワード」を有効化

2. **正しい認証情報を入力**
   - メールアドレスの形式を確認
   - パスワードは6文字以上

3. **パスワードをリセット**（実装予定）
   - 現在はアカウントを再作成

---

### 問題: データが表示されない

#### 原因
- セキュリティルールでブロックされている
- データが存在しない
- ログインしていない

#### 解決方法

1. **Firebaseでデータを確認**
   - Firebase Console → Firestore Database → データ
   - `links`コレクションにデータが存在するか確認
   - 各ドキュメントの`userId`が自分のuidと一致するか確認

2. **自分のuidを確認**
   - Firebase Console → Authentication → Users
   - 自分のメールアドレスのuidをコピー

3. **セキュリティルールを確認**
   - Firebase Console → Firestore Database → ルール
   - ルールが正しく設定されているか確認
   - 「公開」されているか確認

---

### 問題: アプリが起動しない

#### 原因
- Expo サーバーが起動していない
- ネットワーク接続の問題
- キャッシュの問題

#### 解決方法

1. **開発サーバーを再起動**
   ```bash
   # Ctrl+C でサーバーを停止
   npm start
   ```

2. **キャッシュをクリア**
   ```bash
   npx expo start -c
   ```

3. **node_modulesを再インストール**
   ```bash
   rm -rf node_modules
   npm install
   npm start
   ```

---

### 問題: URLメタデータが取得できない

#### 原因
- CORS制限
- JavaScript生成コンテンツ（SPA）
- 認証が必要なページ

#### 解決方法

1. **対応しているサイトを使う**
   - 静的HTMLのサイト
   - OGPタグが設定されているサイト

2. **手動でタイトルを編集**（将来の機能）
   - 現在は自動取得のみ

---

### 問題: iOSシミュレータが起動しない

#### 原因
- Xcodeがインストールされていない
- Command Line Toolsが設定されていない

#### 解決方法

1. **Xcodeをインストール**
   - App StoreからXcodeをインストール

2. **Command Line Toolsを設定**
   - Xcode → Preferences → Locations
   - Command Line Toolsを選択

3. **シミュレータを手動起動**
   ```bash
   open -a Simulator
   ```

---

### 問題: Androidエミュレータが起動しない

#### 原因
- Android Studioがインストールされていない
- エミュレータが作成されていない

#### 解決方法

1. **Android Studioをインストール**
   - [Android Studio](https://developer.android.com/studio)をダウンロード

2. **エミュレータを作成**
   - Android Studio → AVD Manager
   - 新しいVirtual Deviceを作成

3. **エミュレータを手動起動**
   - Android Studio → AVD Manager
   - エミュレータの「▶」ボタンをクリック

---

## 🔍 デバッグ方法

### 開発ツールを使う

1. **React Native Debugger**
   - Metro Bundlerで `j` キーを押してデバッガーを開く

2. **Console ログを確認**
   - 開発サーバーのターミナル出力を確認
   - エラーメッセージやスタックトレースを確認

3. **Firebaseコンソールでデータを確認**
   - Firebase Console → Firestore Database → データ
   - 実際に保存されているデータを確認

---

## 📞 さらにサポートが必要な場合

1. **ドキュメントを確認**
   - [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) - Firestore設定
   - [QUICKSTART.md](QUICKSTART.md) - クイックスタート
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - 詳細セットアップ

2. **公式ドキュメント**
   - [Expo Documentation](https://docs.expo.dev/)
   - [Firebase Documentation](https://firebase.google.com/docs)
   - [React Navigation](https://reactnavigation.org/docs/getting-started)

3. **ログを確認**
   - 開発サーバーの出力
   - Expo Goのログ
   - Firebase Consoleのログ

---

**💡 ヒント**: ほとんどの問題は、Firestoreセキュリティルールの設定忘れか、アプリの再起動で解決します！
