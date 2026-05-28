# ADR 0005: Multi-tenancy strategy — resolution mode is configurable

## Status

Accepted (2026-05-29)

## Context

NeNe Corpus はもともとシングルテナント（1 インストール = 1 組織）を前提として設計されていた。しかし以下の要求が浮上した。

1. **NeNe Records 連携の伏線** — NeNe Records は組織（organization）概念を持つ。将来的に NeNe Corpus のコーパスを組織単位で分離管理し、NeNe Records の `organization_id` と突き合わせる経路が必要になる。
2. **SaaS 提供可能性** — 単一 Docker インスタンスで複数顧客を運用する "SaaS モード" の実現。現状は単一顧客 Tier B が中心だが、ロードマップ上はマルチテナント SaaS への発展を想定している。
3. **Tier B での複数顧客運用** — VPS 1 台に複数組織を相乗りさせることで運用コストを下げたいオペレーター需要がある。

テナント解決（"このリクエストはどの組織のものか"）の実現方式には以下の候補があった。

| 方式 | 概要 | 採用可否 |
|------|------|--------|
| **別 DB per tenant** | テナントごとに独立した DB インスタンスを用意 | 重い・Tier A 非対応 |
| **Schema per tenant** | PostgreSQL スキーマを分離 | MySQL/MariaDB では使えない・Tier A 非対応 |
| **shared DB + org_id filter** | 全テーブルに `organization_id` を付与し SQL レベルで分離 | ✅ 採用 |

## Decision

### テナントモデル

- 全データテーブル（sources, documents, chunks, chat_sessions, chat_messages, rate_limit_buckets, appearance_settings, admin_users）に `organization_id` カラムを追加する。
- テナント解決は **3 つのモード** から superadmin が選択できる。

| モード | 動作 | 実装状態 |
|--------|------|---------|
| `single` | `system_config.tenant_org_slug` で固定した 1 組織のみ運用 | ✅ 実装済み |
| `subdomain` | リクエストホスト名のサブドメインで組織を特定 | stub（将来拡張） |
| `path` | URL パスプレフィックスで組織を特定 | stub（将来拡張） |

- モード設定は `system_config` テーブルに保存し、`OrgResolverMiddleware` がリクエストごとに読み取って `RequestScopedOrgIdHolder` に `organization_id` を注入する。
- 全 `Pdo*Repository` は `RequestScopedOrgIdHolder` 経由で `organization_id` を受け取り、SQL の WHERE 句に付加する（org filter 漏れは設計上の重大な不具合とみなす）。

### 既存データの移行

- 既存の全レコードは `organization_id = 1`（`default` 組織）に紐付ける。
- `default` 組織は初期マイグレーションで自動生成される。
- `single` モードでデプロイしている既存インスタンスは、マイグレーション実行後も動作が変わらない（完全後方互換）。

### バイパスパス

以下のエンドポイントは `OrgResolverMiddleware` を通さない（テナント解決前にアクセスが必要なため）。

- `/admin/auth/*` — ログイン・JWT 取得
- `/admin/superadmin/*` — スーパー管理者操作（`organization_id` は null）
- `/health` — ヘルスチェック
- `/install` — Web インストーラー（Tier A 初期セットアップ）

### スーパー管理者（superadmin）

- `admin_users.role` に `superadmin` 値を追加する（既存 `admin` との 2 値 enum）。
- superadmin は `organization_id` を持たない（IS NULL）グローバルロール。
- superadmin のみが `GET/PATCH /admin/superadmin/system-config` および `CRUD /admin/superadmin/organizations` を呼び出せる。

## Consequences

### Pro

- **future-proof** — subdomain / path モードを stub として配置済みのため、将来の SaaS 化が容易。
- **データ分離保証** — SQL レベルの org filter によりテナント間データ漏洩を防ぐ。
- **単一コードベース** — Tier A / Tier B・シングル / マルチテナントを同一コードで対応できる。
- **NeNe Records 連携準備完了** — `organizations.external_id` を NeNe Records の org ID として使用可能。

### Con

- **全 Repository SQL に org filter が必須** — 新規 Repository 実装時に org filter を追加し忘れると silent data leak になる。`RequestScopedOrgIdHolder` 経由の強制が必要。
- **bypass パスの特別扱い** — ログイン・インストーラー・スーパー管理者 API は `OrgResolverMiddleware` をバイパスする特別扱いが必要。
- **マイグレーション負荷** — 既存テーブル全体への `organization_id` カラム追加と全行への backfill が必要（データ量が多い場合はダウンタイムを伴う可能性）。

## Alternatives considered

1. **別 DB per tenant** — 運用が重い。Tier A（共用ホスティング）では複数 DB の確保が困難。バックアップ・マイグレーション管理が指数的に増える。却下。
2. **Schema per tenant（PostgreSQL のみ）** — MySQL/MariaDB を主サポートする NeNe Corpus には適用できない。Tier A では MySQL 前提のホスティングが多い。却下。

## References

- Issue #274–#280（Phase D マルチテナント実装）
- `src/Tenancy/OrgResolverMiddleware.php`
- `src/Tenancy/RequestScopedOrgIdHolder.php`
- `src/Tenancy/SystemConfigRepository.php`
- `src/Superadmin/` — スーパー管理者 CRUD
- `database/migrations/` — Tenancy 関連マイグレーション
- `docs/integrations/multi-tenancy.md` — 設定方法・運用ガイド
