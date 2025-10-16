# 🚀 クイックデプロイガイド

Firestoreセキュリティルールを**最速で**デプロイする手順です。

---

## ⚡ 最短手順（5分で完了）

### ステップ1: Firebase CLIのインストール

ターミナルで以下を実行：

```bash
npm install -g firebase-tools
```

### ステップ2: ログイン

```bash
firebase login
```

ブラウザが開くので、Googleアカウントでログインしてください。

### ステップ3: プロジェクトを選択

```bash
firebase use --add
```

- プロジェクトリストから **linkdeck-7ccde** を選択
- エイリアス名を入力: `default` と入力してEnter

### ステップ4: デプロイ（ルール + インデックス）

```bash
# セキュリティルールとインデックスを一緒にデプロイ（推奨）
firebase deploy --only firestore
```

または、個別にデプロイ:
```bash
# ルールのみ
firebase deploy --only firestore:rules

# インデックスのみ
firebase deploy --only firestore:indexes
```

✅ これで完了です！

**⚠️ 重要**: インデックスの作成には数分かかります。Firebase Consoleで進行状況を確認できます。

---

## 📋 成功の確認

デプロイが成功すると、以下のようなメッセージが表示されます：

```
✔  firestore: released rules firestore.rules to cloud.firestore

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/linkdeck-7ccde/overview
```

---

## 🎯 次のアクション

### 1. アプリを再起動

開発サーバーが起動している場合は、アプリをリロード：
- ターミナルで `r` キーを押す
- または、Expo Goアプリを完全に終了して再起動

### 2. テスト

1. **ログイン**: アプリでメールアドレスとパスワードでログイン
2. **リンクを追加**:
   - 「リンク」タブの「+」ボタンをタップ
   - URLを入力して保存
3. **タグを作成**:
   - 「タグ」タブを開く
   - 新しいタグを作成

エラーが出なければ、すべて正常に動作しています！

---

## 🚨 エラーが出た場合

### "Missing or insufficient permissions"

**原因**: セキュリティルールがデプロイされていない

**解決策**:
```bash
# もう一度デプロイを実行
firebase deploy --only firestore:rules

# デプロイされたルールを確認
firebase firestore:rules:get
```

### "The query requires an index"

**原因**: Firestoreインデックスがまだ作成中、または作成されていない

**解決策**:
```bash
# インデックスをデプロイ
firebase deploy --only firestore:indexes

# インデックスの状態を確認
firebase firestore:indexes
```

または、エラーメッセージのURLをクリックして手動で作成

詳細: [DEPLOY_INDEXES.md](DEPLOY_INDEXES.md)

### "Permission denied"

**原因**: ログインしていない、またはプロジェクトが選択されていない

**解決策**:
```bash
# 再度ログイン
firebase logout
firebase login

# プロジェクトを確認
firebase projects:list

# プロジェクトを選択
firebase use linkdeck-7ccde

# デプロイ
firebase deploy --only firestore:rules
```

### "Command not found: firebase"

**原因**: Firebase CLIがインストールされていない

**解決策**:
```bash
# インストール
npm install -g firebase-tools

# バージョンを確認
firebase --version
```

---

## 📚 詳細なドキュメント

より詳しい情報は以下を参照：

- **セキュリティルールのデプロイ**: [DEPLOY_FIRESTORE_RULES.md](DEPLOY_FIRESTORE_RULES.md)
- **インデックスのデプロイ**: [DEPLOY_INDEXES.md](DEPLOY_INDEXES.md)
- **手動設定の方法**: [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)
- **トラブルシューティング**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## ✅ チェックリスト

デプロイ前に確認：

- [ ] Node.jsがインストールされている (`node -v`)
- [ ] npmが動作している (`npm -v`)
- [ ] インターネットに接続されている
- [ ] Googleアカウントにアクセスできる

デプロイ後に確認：

- [ ] デプロイ成功メッセージが表示された
- [ ] アプリでログインできる
- [ ] リンクを追加できる
- [ ] タグを作成できる
- [ ] エラーが表示されない

---

**🎉 これで完了です！何か問題があれば、[TROUBLESHOOTING.md](TROUBLESHOOTING.md) を参照してください。**
