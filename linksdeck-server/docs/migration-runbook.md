# Firestore → PostgreSQL 移行手順書（Runbook）

この手順書は、LinksDeck の本番データを Firestore から PostgreSQL へ移行し、`linksdeck-server` を本番切替するための実行ガイドです。

## 1. 目的と対象

- 対象コレクション:
  - `links`
  - `tags`
  - `maintenance/current`
  - `developers`
  - `maintenanceLogs`
  - `users`
- 目標:
  - Firestoreデータを PostgreSQL に正規化して移行
  - 件数・整合性検証後に API 切替
  - 問題発生時は即ロールバック

## 2. 前提条件

- `linksdeck-server` がデプロイ可能状態であること
- PostgreSQL が起動済みであること
- Firebase サービスアカウントJSONを利用可能であること
- 移行作業時間帯にアプリ書き込みを停止できること（メンテナンスモード）

必須環境変数（例）:

```bash
export FIREBASE_PROJECT_ID="your-firebase-project-id"
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/linksdeck?sslmode=disable"
```

## 3. 事前準備

1. 作業ブランチのコードを最新化
2. `linksdeck-server` で依存/生成を最新化

```bash
cd /Users/dokkiitech/.codex/worktrees/118c/LinkDeck/linksdeck-server
make gen
go test ./...
```

3. Firestore のバックアップ取得（必須）
4. 既存環境でメンテナンスモードを ON にして書き込み停止

## 4. 移行コマンド実行

`migrate-firestore` は `export / transform / import / verify` を個別実行できます。

### 4.1 一括実行（推奨）

```bash
cd /Users/dokkiitech/.codex/worktrees/118c/LinkDeck/linksdeck-server
go run ./cmd/migrate-firestore \
  --mode all \
  --project-id "$FIREBASE_PROJECT_ID" \
  --service-account-json "$FIREBASE_SERVICE_ACCOUNT_JSON" \
  --database-url "$DATABASE_URL" \
  --export-file "./tmp/firestore-export.json" \
  --transformed-file "./tmp/transformed.json" \
  --verify-report "./tmp/verify-report.json"
```

### 4.2 ステップ実行（必要時）

```bash
cd /Users/dokkiitech/.codex/worktrees/118c/LinkDeck/linksdeck-server

# 1) Firestoreエクスポート
go run ./cmd/migrate-firestore --mode export \
  --project-id "$FIREBASE_PROJECT_ID" \
  --service-account-json "$FIREBASE_SERVICE_ACCOUNT_JSON" \
  --export-file "./tmp/firestore-export.json"

# 2) 変換
go run ./cmd/migrate-firestore --mode transform \
  --export-file "./tmp/firestore-export.json" \
  --transformed-file "./tmp/transformed.json"

# 3) PostgreSQL取り込み
go run ./cmd/migrate-firestore --mode import \
  --database-url "$DATABASE_URL" \
  --transformed-file "./tmp/transformed.json"

# 4) 検証
go run ./cmd/migrate-firestore --mode verify \
  --database-url "$DATABASE_URL" \
  --transformed-file "./tmp/transformed.json" \
  --verify-report "./tmp/verify-report.json"
```

## 5. 検証項目（切替可否判定）

`./tmp/verify-report.json` で以下を確認:

- `matched == true`
- 件数一致:
  - `users`
  - `links`
  - `tags`
  - `link_tags`
  - `timeline_entries`
  - `developers`
  - `maintenance_logs`
  - `maintenance_status`
- `orphan_link_tags == 0`

追加スモークテスト:

- 認証付きAPIにアクセスできる
- リンクCRUD/タグCRUD/メモ追加削除が成功する
- 管理画面でメンテナンス状態・開発者管理・ログ表示が成功する

## 6. 本番切替手順

1. `linksdeck-server` を本番デプロイ
2. `admin` の `VITE_API_BASE_URL` を新APIへ設定してデプロイ
3. アプリの `EXPO_PUBLIC_API_BASE_URL` を新APIへ設定してデプロイ
4. スモークテスト完了後、メンテナンスモードを OFF

## 7. ロールバック手順

以下のいずれか発生時は即ロールバック:

- 件数不一致
- 認証不通（401/403異常）
- 主要CRUD失敗

ロールバック手順:

1. 新APIへのトラフィックを停止
2. メンテナンスモードは ON のまま維持
3. クライアントのAPI接続先を旧構成へ戻す
4. Firestore運用に戻してサービス復旧
5. 原因修正後に再度移行リハーサル

## 8. 運用メモ

- 変換時に同一ユーザー内の重複タグは統合されます（最古を正）
- `users.encryptedGeminiKey` は移行対象外です
- 生成物は `./tmp/` 配下に出力されます

