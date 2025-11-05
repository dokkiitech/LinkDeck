# 🚀 Firestoreセキュリティルール デプロイガイド

このプロジェクトには、**より詳細なバリデーション機能を持つ本番環境向けのFirestoreセキュリティルール**が含まれています。

## 📋 ルールファイルについて

### `firestore.rules`

プロジェクトルートに作成されたセキュリティルールファイルです。以下の機能が含まれています：

#### ✅ 主な機能

1. **認証チェック**: すべての操作で認証済みユーザーのみアクセス可能
2. **所有者確認**: ユーザーは自分のデータのみ操作可能
3. **フィールドバリデーション**:
   - 必須フィールドの存在チェック
   - データ型の検証
   - 文字列の長さ制限
   - 不変フィールド（userId, createdAt）の保護
4. **型安全性**: オプショナルフィールドの型チェック

#### 🔒 セキュリティ機能

- **ユーザー分離**: 他のユーザーのデータへのアクセスを完全にブロック
- **データ整合性**: 不正なデータ構造の作成を防止
- **不変フィールド保護**: userId/createdAtなど重要フィールドの改ざん防止
- **型検証**: 文字列・配列・真偽値・タイムスタンプの型チェック

---

## 🛠️ デプロイ方法

### 方法1: Firebase CLIでデプロイ（推奨）

#### 1. Firebase CLIのインストール

```bash
npm install -g firebase-tools
```

#### 2. Firebaseにログイン

```bash
firebase login
```

ブラウザが開くので、Googleアカウントでログインしてください。

#### 3. プロジェクトの初期化（初回のみ）

```bash
firebase use --add
```

- プロジェクトリストから **linkdeck-7ccde** を選択
- エイリアス名を入力（例: `default`）

#### 4. セキュリティルールをデプロイ

```bash
firebase deploy --only firestore:rules
```

デプロイが成功すると、以下のようなメッセージが表示されます：

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/linkdeck-7ccde/overview
```

#### 5. デプロイの確認

```bash
firebase firestore:rules:get
```

現在のルールが表示されます。

---

### 方法2: Firebase Consoleで手動設定

CLIが使えない場合は、手動でコピー＆ペーストすることもできます。

#### 1. Firebase Consoleにアクセス

[Firebase Console](https://console.firebase.google.com/) を開き、プロジェクト「**linkdeck-7ccde**」を選択

#### 2. Firestoreセキュリティルールを開く

1. 左側のメニューから「**Firestore Database**」をクリック
2. 上部タブの「**ルール**」をクリック

#### 3. ルールファイルの内容をコピー

プロジェクトルートの [`firestore.rules`](firestore.rules) ファイルの内容をすべてコピー

#### 4. Firebase Consoleにペースト

エディタに貼り付けて、右上の「**公開**」ボタンをクリック

---

## 📊 ルールの詳細

### ユーザーコレクション（users）

```javascript
match /users/{userId} {
  allow read: if isOwner(userId);
  allow create: if isOwner(userId) && バリデーション;
  allow update: if isOwner(userId) && 不変フィールドチェック;
  allow delete: if isOwner(userId);
}
```

**制約**:
- 自分のユーザー情報のみアクセス可能
- email, createdAtは必須
- userId, createdAtは更新不可

### リンクコレクション（links）

```javascript
match /links/{linkId} {
  allow read: if isResourceOwner();
  allow create: if isIncomingOwner() && バリデーション;
  allow update: if isResourceOwner() && 不変フィールドチェック;
  allow delete: if isResourceOwner();
}
```

**制約**:
- 必須フィールド: userId, url, title, tags, isArchived, createdAt
- url/titleは空文字列不可
- tagsは配列型必須
- オプショナルフィールド: description, imageUrl, summary
- userId, createdAtは更新不可

### タグコレクション（tags）

```javascript
match /tags/{tagId} {
  allow read: if isResourceOwner();
  allow create: if isIncomingOwner() && バリデーション;
  allow update: if isResourceOwner() && 不変フィールドチェック;
  allow delete: if isResourceOwner();
}
```

**制約**:
- 必須フィールド: userId, name, createdAt
- nameは1〜50文字
- userId, createdAtは更新不可

---

## 🧪 ルールのテスト

### Firebase Consoleでテスト

1. Firestore Database → ルール → 「**ルールプレイグラウンド**」タブ
2. テストシナリオを作成して実行

### ローカルでテスト（推奨）

```bash
# Firebaseエミュレータをインストール
npm install -g firebase-tools

# エミュレータを起動
firebase emulators:start
```

エミュレータを使用すると、本番環境に影響を与えずにルールをテストできます。

---

## ✅ デプロイ後の確認

### 1. アプリでログイン

アプリを起動し、ログインまたはサインアップ

### 2. リンクを追加

- 「リンク」タブの「+」ボタンをタップ
- URLを入力して保存
- エラーが出ないことを確認

### 3. タグを作成

- 「タグ」タブを開く
- 新しいタグを作成
- エラーが出ないことを確認

### 4. データが表示される

- リンク一覧にデータが表示されることを確認
- リンク詳細画面でデータが表示されることを確認

---

## 🚨 トラブルシューティング

### エラー: "Missing or insufficient permissions"

**原因**:
- ルールがデプロイされていない
- ユーザーがログインしていない
- データのuserIdが一致しない

**解決策**:
1. `firebase deploy --only firestore:rules` を実行
2. アプリでログインしているか確認
3. Firestore ConsoleでデータのuserIdを確認

### エラー: "Permission denied"

**原因**:
- 他のユーザーのデータにアクセスしようとしている
- 必須フィールドが不足している
- 不正なデータ型

**解決策**:
1. 自分のデータのみアクセスしているか確認
2. 必須フィールドがすべて含まれているか確認
3. データ型が正しいか確認（例: tagsは配列）

### デプロイエラー

```bash
# Firebase CLIを最新版にアップデート
npm install -g firebase-tools@latest

# 再度ログイン
firebase logout
firebase login

# プロジェクトを確認
firebase projects:list

# デプロイ
firebase deploy --only firestore:rules
```

---

## 📚 参考資料

- [Firestore セキュリティルール公式ドキュメント](https://firebase.google.com/docs/firestore/security/get-started)
- [ルールの構文](https://firebase.google.com/docs/firestore/security/rules-structure)
- [ルールのテスト](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Firebase CLI リファレンス](https://firebase.google.com/docs/cli)

---

## 🎯 次のステップ

1. ✅ Firebase CLIをインストール
2. ✅ `firebase login` でログイン
3. ✅ `firebase use --add` でプロジェクトを選択
4. ✅ `firebase deploy --only firestore:rules` でデプロイ
5. ✅ アプリを再起動してテスト

**✨ デプロイが完了したら、アプリがすぐに使えるようになります！**
