# CLAUDE.md — NeNe Corpus

Claude Code / AI エージェント向け実行ガイド。このファイルだけで作業を開始できる状態を保つ。
詳細ポリシーの正本は `docs/` 以下に分散しているが、**判断に迷ったらここに戻る**。

---

## プロダクト一言要約

自己ホスト型ナレッジチャット OSS（MIT）。PDF/CSV をアップロードしてコーパスを構築し、**引用付き sync JSON chat** で Q&A に答える。**Tier A**（日本 SMB 共用ホスティング）と **Tier B**（Docker/VPS）の同一コードベース・デュアルデプロイ。

```
既存ホームページ → <script widget.js> ─┐
Admin UI (React)  ──────────────────────┼→ NeNe Corpus API (NENE2/PHP 8.4) → DB
Ops / MCP         ──────────────────────┘         │
                                                  ↓ HTTP read-only（任意）
                                          NeNe Records / 外部 API
                                                  ↓ サーバーサイドのみ
                                          Claude API (tool_use)
```

---

## 現在の開発状況

> **最終更新: 2026-05-28**（`docs/todo/current.md` が正本）

| フェーズ | 状態 |
| --- | --- |
| Phase 0 ガバナンス | ✅ 完了 |
| Phase 1 コーパス取り込み | ✅ 完了 |
| Phase 2 チャット・引用 | ✅ 完了 |
| Phase 3 Admin UI・Widget・Tier A | ✅ 完了 |
| **Phase 3+ オペレーター UX 改善** | ✅ 完了 |
| **Phase 4 外部連携（NeNe Records）** | 🔲 バックログ（Issue 化してから着手） |

**最近の主なマージ:**

| PR | Issue | 内容 |
| --- | --- | --- |
| #200 | #199 | チャット日次トークン制限 Phase B（input/output トークン記録・日次予算） |
| #198 | #197 | チャット利用制限 Phase A（文字数・インターバル・時間別/日次リクエスト制限） |
| #196 | #195 | LLM 設定アコーディオン化 |

---

## Phase 4 バックログ（Issue 化してから実装）

### NeNe Records 外部連携

| 優先 | 項目 | 概要 |
| --- | --- | --- |
| P1 | NeNe Records 読み取りクライアント | `src/Upstream/` に `NeneRecordsClientInterface` + `HttpNeneRecordsClient` 実装 |
| P1 | Admin 設定 UI | `NENE_RECORDS_API_BASE_URL` / `NENE_RECORDS_BEARER_TOKEN` を `.env` 経由で設定 |
| P2 | ローカル corpus + upstream 統合検索 | `search_corpus` ツール拡張：ローカル chunks + NeNe Records API 結果をマージ |
| P3 | Webhook / ポーリング再インデックス | NeNe Records 更新時にローカル chunks を自動更新 |

---

## ワークフロー（守れない場合は作業しない）

1. **GitHub Issue を作成**（または番号を確認）する。Issue なしに編集しない。
2. `docs/roadmap.md`, `docs/todo/current.md`, 関連 Issue/PR を確認する。
3. `main` から `type/issue-number-summary` ブランチを切る。
4. 実装 → 品質チェック（後述）→ commit。
5. PR 作成：`Closes #N` + セルフレビューチェックリスト名を本文に記載。
6. CI green → merge → ローカル `main` sync。
7. `docs/todo/current.md` を最新状態に更新する。

**コミット形式（Conventional Commits）:**
```
<type>(<scope>): <日本語の説明> (#<issue>)
```
- `type`/`scope` は英語。`description`/`body` は日本語可。
- 例: `feat(document): ドキュメント一覧にページング API を追加する (#157)`

**絶対禁止:**
- `main` への直接 commit/push
- Issue なしのコード・ドキュメント変更
- `.env` / `ANTHROPIC_API_KEY` / トークン / パスワードのコミット

---

## アーキテクチャ規約

### PHP レイヤー構造

```
Handler → UseCase → RepositoryInterface → PdoRepository
```

| レイヤー | 責務 | やってはいけないこと |
| --- | --- | --- |
| Handler | HTTP パース・DTO 構築・UseCase 呼び出し・JSON レスポンス | SQL・ビジネスロジック・LLM 直呼び出し |
| UseCase | ビジネスロジック・オーケストレーション | `$_SERVER`・PDO・生 HTTP クライアント |
| Repository | SQL / 永続化のみ | HTTP・セッションロジック |
| Llm アダプター (`Llm/`) | Claude API 呼び出し | ドメイン不変条件 |

**全 PHP ファイルに `declare(strict_types=1);`。クラスは `final readonly` 推奨。**

### モジュール構成（`src/`）—ドメイン別、レイヤー別フォルダ禁止

```
src/
  ApplicationServiceProvider.php   # DI ルート
  Http/           # フロントコントローラー・RuntimeContainerFactory
  AdminAuth/      # JWT Bearer 認証
  Ingestion/      # PDF / CSV / テキスト取り込みパイプライン
  Source/         # ソースファイルメタデータ
  Document/       # 論理ドキュメント CRUD
  Chunk/          # 検索テキストセグメント
  Chat/           # sync JSON chat（SendChatMessageUseCase）
  Session/        # チャットセッション管理
  Message/        # チャットメッセージ管理
  Search/         # 全文検索（LIKE + スコアリング）
  Llm/            # Claude API オーケストレーション（tool_use、最大 3 ラウンド）
  RateLimit/      # レートリミット（セッション / IP）
  Appearance/     # ウィジェット外観設定
  Settings/       # LLM 設定（API キー管理 — ADR 0004）
  Install/        # Web インストーラー（Tier A 専用）
  Config/         # .env 更新ユーティリティ
```

**禁止フォルダ:** `src/Handlers/`, `src/Repositories/`, `src/UseCases/` など。

### 命名規則（主要）

| 役割 | パターン | 例 |
| --- | --- | --- |
| Handler | `{動詞}{名詞}Handler` | `ListDocumentsHandler` |
| UseCase Interface | `{動詞}{名詞}UseCaseInterface` | `ListDocumentsUseCaseInterface` |
| UseCase 実装 | `{動詞}{名詞}UseCase`、メソッドは常に `execute` | `ListDocumentsUseCase::execute` |
| Input / Output DTO | `{動詞}{名詞}Input` / `Output` | `ListDocumentsInput` |
| エンティティ | 単数名詞・サフィックスなし | `Document`, `Chunk` |
| Repository Interface | `{Entity}RepositoryInterface` | `DocumentRepositoryInterface` |
| PDO Repository | `Pdo{Entity}Repository` | `PdoDocumentRepository` |
| 例外 | `{Entity}{Reason}Exception` | `DocumentNotFoundException` |

JSON プロパティ名は **snake_case** 固定。公開 `operationId` はリネーム禁止。

### DB スキーマ

| テーブル | 用途 |
| --- | --- |
| `sources` | アップロード元ファイル（type: csv / pdf / text） |
| `documents` | ソースから生成される論理ドキュメント |
| `chunks` | 検索・引用テキストセグメント |
| `chat_sessions` | コンシューマーチャットセッション |
| `chat_messages` | メッセージ（`citations_json` 付き） |
| `rate_limit_buckets` | レートリミット |
| `admin_users` | 管理者ユーザー |
| `appearance_settings` | ウィジェット外観（theme / hero / chat / layout JSON） |

マイグレーション: `database/migrations/`（Phinx）。スナップショット: `database/schema/`。
SQL は `Pdo*Repository` 内のみ。

---

## フロントエンド規約

```
frontend/
  apps/admin/       # 管理 SPA — Tailwind CSS v4 + React
  apps/widget/      # 埋め込みウィジェット — BEM + CSS 変数 → widget.js
  packages/
    api-client/     # snake_case 型 + fetch ヘルパー（OpenAPI に追従）
    i18n/           # Msg キー定数 + ロケールカタログ（ja/en/de/fr/zh-Hans/pt-BR）
    tokens/         # nc.* BEM クラス定数 + CSS 変数名
```

| ルール | 内容 |
| --- | --- |
| Widget スタイル | BEM + `var(--nc-*)` のみ。**Tailwind 禁止** |
| Widget クラス | `@nene-corpus/tokens` の `nc.*` 定数を使う。JSX へのハードコード禁止 |
| Admin スタイル | Tailwind utility classes in TSX |
| JWT | Admin JWT をウィジェットに渡さない |
| JSON | `snake_case` のまま使う（クライアント側でリネームしない） |
| 文字列 | UI 文字列はロケールカタログに。ハードコード禁止 |

**`keys.ts` 更新後の注意:** dev サーバーが古い `Msg` を返すことがある。admin (:5173) と widget (:5174) を両方再起動する。
**静的ビルド注意:** `:8080` 利用時は `npm run build:release --prefix frontend` が必要（`public_html/admin/` は自動更新されない）。

---

## 絶対禁止パターン

- `main` への直接 commit/push
- Issue なしのコード・ドキュメント・設定変更
- `.env` / `ANTHROPIC_API_KEY` / JWT などのコミット
- NeNe Records へのチャットロジック統合（ADR 0002）
- MCP をコンシューマーチャット（embed widget）に露出
- `Pdo*Repository` 以外での SQL / PDO
- `src/Handlers/` `src/Repositories/` などレイヤー別フォルダ
- JSON プロパティを camelCase にする（snake_case 固定）
- 出荷済み `operationId` のリネーム
- widget に Tailwind を使う
- Admin JWT をウィジェットに渡す
- SSE ストリーミングの実装（非ゴール）
- NeNe Records への直接 DB 接続や共有

---

## 重要用語（詳細: `docs/explanation/glossary.md`）

| 正式用語 | 使わない言葉 |
| --- | --- |
| **sync JSON chat** | "streaming chat", "SSE", "REST polling" |
| **embed widget** | "chat widget" 単独, "plugin", "snippet" |
| **corpus** | "knowledge base"（マーケティングのみ OK） |
| **source** | "file"（ソースエンティティの意味で） |
| **chunk** | "paragraph", "embedding row" |
| **ingestion** | "import", "ETL" |
| **handler** | "controller"（新規コードでは禁止） |
| **use case** | "service"（UseCase レイヤーの意味で） |
| **Tier A** | "rental server tier", "FTP tier" |
| **Tier B** | "cloud-only", "dev tier" |

---

## 品質チェック（merge 前に必ず実行）

```bash
composer check                         # PHPUnit + PHPStan level8 + CS-Fixer + OpenAPI + MCP
npm run check --prefix frontend        # TypeScript + lint
docker compose up --build -d           # ローカルスタック確認
curl -fsS http://localhost:8080/health
```

## セルフレビューチェックリスト（PR 本文に記載）

| ファイル | 使う場面 |
| --- | --- |
| `docs/review/backend-api.md` | ハンドラー・UseCase・ルート変更 |
| `docs/review/openapi-contract.md` | OpenAPI スキーマ変更 |
| `docs/review/database.md` | マイグレーション・リポジトリ |
| `docs/review/middleware-security.md` | 認証・CORS・レートリミット |
| `docs/review/docs-policy.md` | ドキュメント・ADR |

---

## Source of Truth（詳細参照先）

| 目的 | ドキュメント |
| --- | --- |
| 現在のタスク | `docs/todo/current.md` |
| ロードマップ | `docs/roadmap.md` |
| ワークフロー詳細 | `docs/workflow.md` |
| コミット規約 | `docs/development/commit-conventions.md` |
| コーディング標準 | `docs/development/coding-standards.md`, `docs/development/backend-standards.md` |
| 命名規則 | `docs/development/naming-conventions.md` |
| 用語集 | `docs/explanation/glossary.md` |
| フロントエンド標準 | `docs/development/frontend-standards.md` |
| デプロイ（Tier A/B） | `docs/deployment/README.md`, ADR 0003 |
| NENE2 継承マップ | `docs/inheritance-from-nene2.md` |
| NeNe Records 境界 | `docs/integrations/nene-records-client.md` |
| AI ツールポリシー | `docs/integrations/ai-tools.md` |
| エージェント入口 | `AGENTS.md` |
