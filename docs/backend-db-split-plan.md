# LinksDeck バックエンド/DB切り出し実行計画（Go + OpenAPI + Swagger UI + PostgreSQL + Coolify + Firebase Auth）

## サマリ
現行のFirestore直アクセス構成を、`/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/linksdeck-server` のGo API経由構成へ全面移行します。  
方針は「Cloud Firestoreからの全面移行」「一括切替（停止30-60分許容）」「OpenAPI-first + oapi-codegen」「PostgreSQLはタグ正規化」「IDは既存FirestoreドキュメントIDを維持」「Geminiキーは現状どおり端末保管」です。  
実装作業着手前に、計画書Markdownを先に作成します。

## 先に作る計画書（作業開始条件）
1. 最初のコミット対象として `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/docs/backend-db-split-plan.md` を作成する。
2. 同ファイルに本計画の「API仕様」「DBスキーマ」「移行Runbook」「切替/ロールバック」「検証項目」を転記する。
3. 以降の実装はこのmdを唯一の実行仕様として進める。

## 現状境界（確認済み）
| 領域 | 現在の実装 | 主要ファイル |
|---|---|---|
| モバイルDBアクセス | Firestore直接アクセス | `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/src/services/firestore.ts` |
| モバイル運用系（メンテ） | Firestore直接アクセス + onSnapshot | `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/src/services/maintenance.ts` |
| 管理画面運用系 | Firestore直接アクセス | `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/admin/src/services/maintenance.ts` |
| 認証 | Firebase Auth（継続利用） | `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/src/contexts/AuthContext.tsx`, `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/admin/src/firebase.ts` |
| データ保護 | Firestore Rules | `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/firestore.rules` |
| 既存Cloud Functions | Geminiキー暗号化保存機能あり（今回非採用） | `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/functions/src/index.ts` |

## 追加/変更する公開API・インターフェース（重要）
| 区分 | 変更内容 | 互換方針 |
|---|---|---|
| モバイル/管理画面のデータアクセス | Firestore SDK呼び出しをHTTP API呼び出しへ変更 | UI層の型は極力維持し、サービス層でDTO変換 |
| 認証 | Firebase ID Tokenを`Authorization: Bearer`で送信 | Firebase Auth自体は変更なし |
| メンテナンス監視 | Firestore `onSnapshot` をAPIポーリング（15秒）へ置換 | 挙動互換（表示ロジックは維持） |
| タイムラインID | Firestore配列index由来IDからDB永続IDへ変更 | フロントでは`string`型を維持 |

## `linksdeck-server` 実装仕様（決定済み）
1. ディレクトリを `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/linksdeck-server` に新設する。
2. GoはOpenAPI-firstで実装し、`api/openapi.yaml` を単一の仕様ソースにする。
3. `oapi-codegen` でserver interface/DTOを生成し、手書きハンドラは `internal/handler` に限定する。
4. ルーティングはchi、DBはpgx + sqlc、マイグレーションはgolang-migrateを採用する。
5. Swagger UIは `/swagger`、OpenAPI JSONは `/openapi.json` で公開する。
6. 認証ミドルウェアはFirebase Admin SDKでID Token検証し、`sub` を `user_id` として利用する。
7. 管理者権限は `developers` テーブル存在チェックで判定する（既存仕様準拠）。

## APIエンドポイント仕様（v1）
| Method | Path | 認証 | 用途 |
|---|---|---|---|
| GET | `/v1/health/live` | 不要 | Liveness |
| GET | `/v1/health/ready` | 不要 | Readiness |
| GET | `/v1/maintenance/status` | 不要 | メンテ状態取得 |
| GET | `/v1/links` | 必須 | リンク一覧（`includeArchived`,`tag`） |
| POST | `/v1/links` | 必須 | リンク作成 |
| GET | `/v1/links/{linkId}` | 必須 | リンク詳細 |
| PATCH | `/v1/links/{linkId}` | 必須 | リンク更新（タイトル/URL/isArchived/summary） |
| DELETE | `/v1/links/{linkId}` | 必須 | リンク削除 |
| GET | `/v1/links/exists` | 必須 | URL重複チェック（`url`） |
| POST | `/v1/links/{linkId}/tags` | 必須 | タグ付与（name指定） |
| DELETE | `/v1/links/{linkId}/tags/{tagName}` | 必須 | タグ除去 |
| POST | `/v1/links/{linkId}/notes` | 必須 | ノート追加 |
| DELETE | `/v1/links/{linkId}/notes/{noteId}` | 必須 | ノート削除 |
| GET | `/v1/tags` | 必須 | タグ一覧 |
| POST | `/v1/tags` | 必須 | タグ作成 |
| DELETE | `/v1/tags/{tagId}` | 必須 | タグ削除 |
| GET | `/v1/me/developer` | 必須 | 開発者判定 |
| PUT | `/v1/admin/maintenance` | 必須(管理者) | メンテ切替 |
| GET | `/v1/admin/developers` | 必須(管理者) | 開発者一覧 |
| POST | `/v1/admin/developers` | 必須(管理者) | 開発者追加 |
| DELETE | `/v1/admin/developers/{uid}` | 必須(管理者) | 開発者論理削除 |
| GET | `/v1/admin/maintenance-logs` | 必須(管理者) | ログ一覧 |

## PostgreSQLスキーマ仕様（決定済み）
| テーブル | 主キー | 主要カラム |
|---|---|---|
| `users` | `id text` | `email`, `display_name`, `created_at`, `updated_at` |
| `links` | `id text` | `user_id`, `url`, `title`, `is_archived`, `summary`, `created_at`, `updated_at` |
| `tags` | `id text` | `user_id`, `name`, `created_at` |
| `link_tags` | `(link_id, tag_id)` | `created_at` |
| `timeline_entries` | `id text` | `link_id`, `type`, `content`, `created_at` |
| `maintenance_status` | `id text` (`current`) | `is_maintenance_mode`, `reason`, `started_at`, `started_by` |
| `developers` | `uid text` | `email`, `added_at`, `deleted_at` |
| `maintenance_logs` | `id text` | `action`, `reason`, `performed_by`, `performed_by_uid`, `timestamp`, `previous_status` |

## Firestore→PostgreSQL移行仕様（決定済み）
1. 対象コレクションは `links`, `tags`, `maintenance/current`, `developers`, `maintenanceLogs`, `users` とする。
2. FirestoreドキュメントIDはそのままPostgreSQL主キーへ移す。
3. `links.tags[]` は `tags` と `link_tags` に正規化する。
4. 同一`user_id`内で同名タグが複数ある場合は最古1件を正とし、他は統合してレポート出力する。
5. `links.timeline[]` は `timeline_entries` に分解し、移行時IDは `${linkId}_${index}` で生成する。
6. タイムスタンプはすべてUTCの`timestamp with time zone`に変換する。
7. `users.encryptedGeminiKey` は移行しない（Geminiキー現状維持方針のため）。
8. 移行ツールは `linksdeck-server/cmd/migrate-firestore` に実装し、`export/transform/import/verify` を分離する。

## 実装フェーズ（順序固定）
1. 計画md作成: `/Users/dokkiitech/.codex/worktrees/118c/LinkDeck/docs/backend-db-split-plan.md` を先に作成。
2. サーバー雛形: `linksdeck-server` 作成、Go module、OpenAPI雛形、Swagger UI、health endpoint実装。
3. DB基盤: migration作成、sqlc生成、repository層作成、主要インデックス追加。
4. 認証/認可: Firebaseトークン検証ミドルウェア、管理者判定ミドルウェア実装。
5. API実装: 上記v1 endpointsを全実装し、OpenAPIとレスポンス一致を担保。
6. クライアント切替: モバイルの`firestore.ts`/`maintenance.ts`、管理画面`maintenance.ts`をHTTPクライアントへ置換。
7. 移行ツール実装: Firestore抽出・変換・投入・検証CLIを実装。
8. Coolify構築: APIサービス1つ + PostgreSQL1つを作成し、envとhealthcheckを設定。
9. Staging移行演習: 本番相当データでドライランし、件数照合と機能試験を完了。
10. 本番一括切替: 停止30-60分で移行実行、検証後に新APIへ切替、失敗時ロールバック。

## Coolify構成（決定済み）
1. サービスは2つだけ作成する: `linksdeck-server`（Go API）と`linksdeck-postgres`（Managed PostgreSQL）。
2. `linksdeck-server` は `linksdeck-server/Dockerfile` でbuild/runする。
3. 必須環境変数は `DATABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `CORS_ALLOW_ORIGINS`, `PORT`, `LOG_LEVEL` とする。
4. Readinessは `/v1/health/ready`、Livenessは `/v1/health/live` を使用する。

## 切替Runbook（一括）
1. 切替開始前にFirestoreバックアップを取得する。
2. Firestore側でメンテナンスモードをONにして書き込みを停止する。
3. Firestoreデータをエクスポートし、PostgreSQLへインポートする。
4. 検証SQLで件数・整合性・サンプルデータ差分を確認する。
5. Coolify上の新APIを本番有効化し、モバイル/管理画面を新API接続設定でデプロイする。
6. スモークテスト通過後にメンテナンスモードを解除する。

## ロールバックRunbook
1. 検証NG時は新APIを切り離し、メンテナンスモードを維持したまま切替を中止する。
2. Firestoreを継続利用する既存運用へ戻す。
3. PostgreSQLは失敗バッチを破棄し、原因修正後に再実行する。
4. ロールバック判定は「件数不一致」「認証不通」「主要CRUD失敗」のいずれか1件で即時実施する。

## テストケースと受け入れ基準
1. 認証: 正常トークン、期限切れ、改ざん、未送信の4ケースで期待どおり403/401/200になる。
2. リンクCRUD: 作成→取得→更新→削除が全て本人データで成功し、他人データで拒否される。
3. タグ正規化: 同名タグ重複が統合され、リンクとの関連が欠損しない。
4. メモ/要約: タイムライン追加削除で順序とIDが安定して返る。
5. 管理機能: 開発者のみメンテ切替/開発者管理/ログ閲覧可能。
6. 移行検証: `links/tags/developers/maintenanceLogs` の件数一致率100%、リンク別タグ紐付け欠損0件。
7. E2E: モバイル主要導線（追加・一覧・詳細・タグ・アーカイブ・検索）とadmin導線（メンテ/開発者/ログ）が通る。
8. パフォーマンス: `GET /v1/links` のp95が500ms以内（本番相当データ）。

## 明示的な前提・デフォルト
1. 移行元はCloud Firestore（Native mode）である。
2. Firebase Authenticationは継続利用し、バックエンドはID Token検証のみ行う。
3. Gemini APIキーは端末保管を維持し、サーバー保管へは移行しない。
4. FirestoreドキュメントIDは主キーとして維持する。
5. 一括切替の停止許容は30-60分とする。
6. 実装開始前に計画mdを先に作る運用を必須とする。
