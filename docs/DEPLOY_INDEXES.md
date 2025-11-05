# 🔍 Firestoreインデックス デプロイガイド

## 📋 問題: "The query requires an index" エラー

リンクの保存はできるが読み込めない場合、以下のエラーが表示されます：

```
ERROR Error loading links: [FirebaseError: The query requires an index.
You can create it here: https://console.firebase.google.com/...]
```

これは、**Firestoreの複合クエリにインデックスが必要**だからです。

---

## 🎯 必要なインデックス

このアプリでは、以下の複合クエリを使用しています：

### 1. リンク一覧取得（アーカイブ除外）
```typescript
where('userId', '==', userId)
where('isArchived', '==', false)
orderBy('createdAt', 'desc')
```

**必要なインデックス**:
- `userId` (ASC)
- `isArchived` (ASC)
- `createdAt` (DESC)

### 2. リンク一覧取得（全て）
```typescript
where('userId', '==', userId)
orderBy('createdAt', 'desc')
```

**必要なインデックス**:
- `userId` (ASC)
- `createdAt` (DESC)

### 3. タグ一覧取得
```typescript
where('userId', '==', userId)
orderBy('createdAt', 'desc')
```

**必要なインデックス**:
- `userId` (ASC)
- `createdAt` (DESC)

---

## 🚀 デプロイ方法

### 方法A: Firebase CLI（推奨）- 最速

プロジェクトルートに [`firestore.indexes.json`](firestore.indexes.json) ファイルが作成されています。

#### 1. Firebase CLIでデプロイ

```bash
# ルールと一緒にデプロイ
firebase deploy --only firestore

# またはインデックスのみデプロイ
firebase deploy --only firestore:indexes
```

#### 2. デプロイの確認

```bash
# 現在のインデックスを確認
firebase firestore:indexes
```

**メリット**:
- ✅ 一度にすべてのインデックスを作成
- ✅ バージョン管理が可能
- ✅ チーム全体で同じ設定を共有

---

### 方法B: エラーメッセージのURLから作成（簡単）

エラーメッセージに含まれるURLをクリックするだけで、自動的にインデックスが作成されます。

#### 手順

1. エラーメッセージをコピー
2. URLをクリック（または貼り付け）
3. Firebase Consoleでインデックス作成画面が開く
4. 「インデックスを作成」ボタンをクリック
5. 作成完了まで数分待つ（進行状況バーが表示されます）

**注意**: この方法では、エラーが出るたびに1つずつインデックスを作成する必要があります。

---

### 方法C: Firebase Consoleで手動作成

Firebase Consoleから手動でインデックスを作成できます。

#### 1. Firebase Consoleにアクセス

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト「**linkdeck-7ccde**」を選択
3. 左側のメニューから「**Firestore Database**」をクリック
4. 上部タブの「**インデックス**」をクリック

#### 2. 複合インデックスを作成

「複合」タブで「**インデックスを追加**」ボタンをクリック

**インデックス1: リンク一覧（アーカイブ除外）**

| フィールド | 順序 |
|----------|------|
| userId | 昇順 |
| isArchived | 昇順 |
| createdAt | 降順 |

- コレクションID: `links`
- クエリスコープ: `Collection`

**インデックス2: リンク一覧（全て）**

| フィールド | 順序 |
|----------|------|
| userId | 昇順 |
| createdAt | 降順 |

- コレクションID: `links`
- クエリスコープ: `Collection`

**インデックス3: タグ一覧**

| フィールド | 順序 |
|----------|------|
| userId | 昇順 |
| createdAt | 降順 |

- コレクションID: `tags`
- クエリスコープ: `Collection`

#### 3. インデックス作成を待つ

各インデックスの作成には数分かかります。進行状況は「インデックス」タブで確認できます。

---

## ✅ デプロイの確認

### 1. Firebase Consoleで確認

Firestore Database → インデックス → 複合タブ

すべてのインデックスのステータスが「**有効**」になっていることを確認

### 2. アプリで確認

```bash
# アプリをリロード
# ターミナルで r キーを押す
```

1. アプリでログイン
2. 「リンク」タブを開く
3. リンクが表示されることを確認
4. エラーが出ないことを確認

---

## 🔍 インデックス作成状況の確認

### Firebase Console

Firestore Database → インデックス → 複合タブ

インデックスのステータス:
- 🟡 **作成中** - 数分待ってください
- 🟢 **有効** - 使用可能
- 🔴 **エラー** - 設定を確認してください

### Firebase CLI

```bash
# インデックス一覧を表示
firebase firestore:indexes

# 特定のコレクションのインデックスを確認
firebase firestore:indexes --collection links
```

---

## 🚨 トラブルシューティング

### エラー: "The query requires an index"（まだ表示される）

**原因**:
- インデックスがまだ作成中
- 間違ったインデックスを作成した
- アプリをリロードしていない

**解決策**:
1. Firebase Consoleでインデックスのステータスを確認
2. すべてのインデックスが「有効」になるまで待つ（5〜10分）
3. アプリを完全に再起動
4. それでもエラーが出る場合は、エラーメッセージのURLから再度作成

### インデックス作成が「エラー」になる

**原因**:
- 既に同じインデックスが存在している
- フィールド名が間違っている

**解決策**:
1. 既存のインデックスを削除
2. もう一度作成
3. フィールド名を確認（大文字小文字も区別されます）

### デプロイが失敗する

```bash
# Firebase CLIを最新版にアップデート
npm install -g firebase-tools@latest

# 再度ログイン
firebase logout
firebase login

# プロジェクトを確認
firebase use

# デプロイ
firebase deploy --only firestore:indexes
```

---

## 📊 インデックスファイルの内容

[`firestore.indexes.json`](firestore.indexes.json) には、以下のインデックス定義が含まれています：

```json
{
  "indexes": [
    {
      "collectionGroup": "links",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isArchived", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "links",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tags",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🎯 おすすめのデプロイ順序

1. ✅ **Firestoreセキュリティルールをデプロイ** - [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
2. ✅ **Firestoreインデックスをデプロイ** - このガイド

まとめてデプロイ:
```bash
firebase deploy --only firestore
```

これで、セキュリティルールとインデックスが同時にデプロイされます。

---

## 📚 参考資料

- [Firestore インデックス公式ドキュメント](https://firebase.google.com/docs/firestore/query-data/indexing)
- [複合インデックスの管理](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Firebase CLI リファレンス](https://firebase.google.com/docs/cli)

---

**✨ インデックスをデプロイすれば、リンクが正常に読み込まれるようになります！**
