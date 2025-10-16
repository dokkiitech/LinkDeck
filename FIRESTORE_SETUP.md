# 🔥 Firestore セキュリティルール設定ガイド

## ⚠️ 重要: 必須の設定手順

現在、Firestoreのセキュリティルールが設定されていないため、以下のエラーが発生しています：

```
Error loading links: [FirebaseError: Missing or insufficient permissions.]
```

この問題を解決するには、Firebase Consoleでセキュリティルールを設定する必要があります。

---

## 📦 2つのデプロイ方法

### 🔥 方法1: Firebase CLI（推奨）- 自動デプロイ

プロジェクトルートに[`firestore.rules`](firestore.rules)ファイルが作成されています。

**詳細な手順**: [DEPLOY_FIRESTORE_RULES.md](DEPLOY_FIRESTORE_RULES.md) を参照

**クイックスタート**:
```bash
# Firebase CLIをインストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクトを選択
firebase use --add
# → linkdeck-7ccde を選択

# デプロイ
firebase deploy --only firestore:rules
```

**メリット**:
- ✅ バージョン管理が可能
- ✅ 詳細なバリデーション機能
- ✅ 型チェック・フィールド保護
- ✅ 自動デプロイ

---

### 🖱️ 方法2: Firebase Console - 手動コピー＆ペースト

CLIが使えない場合は、以下の手順でFirebase Consoleから手動設定できます。

---

## 🚀 クイック設定手順（手動）

### 1. Firebase Consoleにアクセス

1. [Firebase Console](https://console.firebase.google.com/)を開く
2. プロジェクト「**linkdeck-7ccde**」を選択

### 2. Firestoreセキュリティルールを開く

1. 左側のメニューから「**Firestore Database**」をクリック
2. 上部タブの「**ルール**」をクリック

### 3. セキュリティルールをコピー＆ペースト

以下のルールをコピーして、エディタに貼り付けてください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーコレクション
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // リンクコレクション
    match /links/{linkId} {
      // 読み取り・更新・削除: 自分のリンクのみ
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;

      // 作成: 認証済みユーザーが自分のuserIdでのみ作成可能
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // タグコレクション
    match /tags/{tagId} {
      // 読み取り・更新・削除: 自分のタグのみ
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;

      // 作成: 認証済みユーザーが自分のuserIdでのみ作成可能
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 4. 公開する

1. エディタの右上にある「**公開**」ボタンをクリック
2. 確認ダイアログで「**公開**」をクリック

### 5. アプリを再起動

1. アプリを再起動（Expo Goを完全に終了して再起動）
2. またはメトロバンドラーをリロード（`r`キーを押す）

---

## ✅ 設定確認

設定が完了したら、以下を確認してください：

### 1. ログインできるか
- アプリでログインまたはサインアップ
- エラーが出ないことを確認

### 2. タグを作成できるか
- 「タグ」タブを開く
- 新しいタグを作成
- エラーが出ないことを確認

### 3. リンクを追加できるか
- 「リンク」タブの「+」ボタンをタップ
- URLを入力して保存
- エラーが出ないことを確認

---

## 🔒 セキュリティルールの説明

### ユーザーコレクション（users）
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

- ユーザーは自分のユーザー情報のみ読み書き可能
- 他のユーザーの情報は読めない

### リンクコレクション（links）
```javascript
match /links/{linkId} {
  allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
}
```

- **read/update/delete**: 既存リンクの`userId`が自分のuidと一致する場合のみ可能
- **create**: 新規作成時、`userId`フィールドに自分のuidを設定している場合のみ可能
- 他のユーザーのリンクは見えない

### タグコレクション（tags）
```javascript
match /tags/{tagId} {
  allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
}
```

- リンクコレクションと同じルール
- 自分のタグのみ操作可能

---

## 🚨 トラブルシューティング

### エラー: "Missing or insufficient permissions"

**原因**:
- セキュリティルールが設定されていない
- セキュリティルールが公開されていない
- ユーザーがログインしていない

**解決策**:
1. Firebase Consoleでルールを確認
2. 「公開」ボタンをクリックしたか確認
3. アプリでログインしているか確認
4. アプリを再起動

### エラー: "Unsupported field value: undefined"

**原因**:
- Firestoreに`undefined`値を保存しようとしている

**解決策**:
- ✅ **既に修正済み**: `src/services/firestore.ts`を更新しました
- アプリを再起動してください

### データが表示されない

**原因**:
- セキュリティルールでブロックされている
- データが存在しない

**解決策**:
1. Firebase Console → Firestore Database → 「データ」タブ
2. `links`コレクションにデータが存在するか確認
3. 各ドキュメントの`userId`が自分のuidと一致するか確認

---

## 📋 設定チェックリスト

- [ ] Firebase Consoleにアクセス
- [ ] Firestore Database → ルールを開く
- [ ] セキュリティルールをコピー＆ペースト
- [ ] 「公開」ボタンをクリック
- [ ] アプリを再起動
- [ ] ログイン・サインアップができることを確認
- [ ] タグ作成ができることを確認
- [ ] リンク追加ができることを確認

---

## 🔗 参考リンク

- [Firebase Console](https://console.firebase.google.com/)
- [Firestore セキュリティルール公式ドキュメント](https://firebase.google.com/docs/firestore/security/get-started)
- [セキュリティルールの基礎](https://firebase.google.com/docs/firestore/security/rules-structure)

---

**✅ セキュリティルールを設定すれば、すぐにアプリが使えるようになります！**
