# LinkDeck クイックスタートガイド

## ✅ 完了した設定

1. **プロジェクト初期化**: ✅ 完了
2. **Firebase設定**: ✅ 完了（.envファイル作成済み）
3. **開発サーバー起動**: ✅ 起動中

## 🚀 次のステップ

### 1. アプリケーションを実機/シミュレータで起動

現在、開発サーバーが起動しています。以下の方法でアプリを起動できます：

#### **方法A: iOSシミュレータで起動**
ターミナルで **`i`** キーを押す

#### **方法B: Androidエミュレータで起動**
ターミナルで **`a`** キーを押す

#### **方法C: 実機で起動**
1. App Store/Google Playから「Expo Go」アプリをダウンロード
2. ターミナルに表示されているQRコードをスキャン

---

## ⚠️ 重要: Firebase設定（必須）

アプリを起動する前に、Firebase Consoleで以下の設定を行ってください。

### 🔥 ステップ1: Firestoreセキュリティルールを設定

**現在、この設定が未完了のため、以下のエラーが発生します：**
```
Error loading links: [FirebaseError: Missing or insufficient permissions.]
```

#### 設定方法

1. [Firebase Console](https://console.firebase.google.com/)を開く
2. プロジェクト「**linkdeck-7ccde**」を選択
3. 左メニュー → **Firestore Database** → **ルール**タブ
4. 以下のルールをコピー＆ペースト
5. 右上の「**公開**」ボタンをクリック

**詳細な手順**: [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)を参照

### 🔐 ステップ2: Authentication を有効化

```bash
Firebase Console → Authentication → Sign-in method
```

- ✅ メール/パスワード認証を**有効化**してください

---

## 📋 Firestoreセキュリティルール

以下をFirebase Consoleにコピー＆ペーストしてください：

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

**📝 注意**:
- このルールをコピーした後、必ず「**公開**」ボタンをクリックしてください
- 公開しないとルールが適用されません

---

## 🧪 動作テスト手順

### 1. アカウント作成

1. アプリが起動すると**ログイン画面**が表示される
2. 「アカウントをお持ちでない方はこちら」をタップ
3. 以下の情報を入力：
   - **表示名**: 任意の名前
   - **メールアドレス**: test@example.com
   - **パスワード**: test1234（6文字以上）
4. 「登録」ボタンをタップ

### 2. ログイン

1. 登録したメールアドレスとパスワードでログイン
2. メイン画面（リンク一覧）が表示されることを確認

### 3. タグの作成

1. 下部タブバーから「**タグ**」をタップ
2. 新しいタグ名を入力（例: `技術記事`）
3. 「作成」ボタンをタップ
4. タグが一覧に表示されることを確認

### 4. Firestoreでデータ確認

1. Firebase Console → Firestore Database
2. 「データ」タブを開く
3. 以下のコレクションが作成されていることを確認：
   - `tags` コレクション（作成したタグ）

---

## 📦 現在実装済みの機能

### ✅ 完全に動作する機能

- [x] ユーザー登録・ログイン・ログアウト
- [x] タグの作成・削除
- [x] リンク一覧の表示（現在は空）
- [x] リンク詳細の表示
- [x] 設定画面

### 🚧 実装準備中の機能

- [ ] iOS共有機能（他のアプリからURLを保存）
- [ ] URLメタデータの自動取得
- [ ] AI要約機能（Gemini API統合）

---

## 🔧 リンクの手動追加（テスト用）

現在、iOS共有機能は未実装のため、テスト用にFirestore Consoleから直接リンクを追加できます：

### Firebase Consoleでリンクを追加

1. Firebase Console → Firestore Database → 「データ」タブ
2. 「コレクションを開始」をクリック
3. コレクションID: `links`
4. 最初のドキュメントを追加：

```json
{
  "userId": "あなたのユーザーUID（認証タブで確認）",
  "url": "https://example.com",
  "title": "テストリンク",
  "description": "これはテストリンクです",
  "imageUrl": "https://via.placeholder.com/400x200",
  "tags": ["技術記事"],
  "isArchived": false,
  "createdAt": "現在のタイムスタンプ"
}
```

5. アプリをリフレッシュ（下に引っ張る）
6. リンクが表示されることを確認

---

## 🛠 トラブルシューティング

### エラー: "Firebase: Error (auth/invalid-api-key)"

**原因**: `.env` ファイルが読み込まれていない

**解決策**:
```bash
# 開発サーバーを停止（Ctrl+C）
# キャッシュをクリアして再起動
npx expo start -c
```

### エラー: "permission-denied"

**原因**: Firestoreセキュリティルールが設定されていない

**解決策**:
1. Firebase Console → Firestore Database → ルール
2. 上記のセキュリティルールをコピーして貼り付け
3. 「公開」をクリック

### アプリが真っ白な画面

**原因**: ビルドエラーまたはキャッシュの問題

**解決策**:
```bash
# ターミナルでサーバーを停止（Ctrl+C）
rm -rf node_modules
npm install
npx expo start -c
```

---

## 📚 次に読むべきドキュメント

- **[README.md](README.md)** - プロジェクト全体の概要
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - 詳細なセットアップ手順
- **[CLAUDE.md](CLAUDE.md)** - 技術的な実装詳細

---

## 🎯 今後の開発ロードマップ

### Phase 1: コア機能（実装準備中）
1. iOS共有拡張機能
2. URLメタデータ自動取得
3. Gemini API統合

### Phase 2: UI/UX改善
1. ダークモード
2. タイムライン表示
3. 検索機能

### Phase 3: 高度な機能
1. エクスポート機能
2. ブックマークレット
3. オフライン対応

---

**🎉 おめでとうございます！LinkDeckの開発環境が正常にセットアップされました！**

何か問題が発生した場合は、[SETUP_GUIDE.md](SETUP_GUIDE.md) のトラブルシューティングセクションを参照してください。
