# Current Work

Last updated: 2026-05-26 (session 2)

## 最近の docs 更新

- Phase 1 完了 — corpus ingestion milestone (#7–#15)
- Phase 2 完了 — chat sessions, chunk search, sync JSON, rate limiting
- Phase 3 進行 — frontend monorepo, widget, admin UI, appearance, i18n, admin デザイン (#33–#92)
- Phase 3+ バックログ追記 — オペレーター docs、テキスト取り込み、Widget UX 拡張
- Tier A 完了 — web installer (#101)、release ZIP (#103)、shared-hosting docs (#105)
- **CLAUDE.md 拡充 (#157)** — Cursor ルール統合・現在状態・バックログ・アーキテクチャ規約を追記（Claude Code 単独起動対応）

## 状態サマリー

**Phase 1 — Corpus & Ingestion: 完了（2026-05-25）**

**Phase 2 — Chat & Citations: 完了（2026-05-25）**

**Phase 3 — Admin UI & Widget: 完了（2026-05-25）**

| 項目 | 状態 |
| --- | --- |
| Frontend monorepo + widget + sync JSON chat | ✅ |
| Admin sources / ingestion / conversation logs | ✅ |
| Widget i18n + Appearance settings | ✅ |
| Admin i18n + locale fonts + light/dark theme | ✅ |
| **Tier A web installer + release ZIP** | ✅ installer / ✅ ZIP build |
| **Shared-hosting operator docs（installer 連動）** | ✅ |

`composer check` / `npm run check --prefix frontend` / GitHub Actions CI green。

---

## Phase 3 残り（Tier A）

Tier A コア（installer、release ZIP、operator docs）は完了。Phase 3 milestone クローズ後、Phase 3+ バックログを再整理。

Milestone: [`docs/milestones/2026-05-admin-ui-and-widget.md`](../milestones/2026-05-admin-ui-and-widget.md)

---

## Phase 3+ バックログ（合意済み・未着手）

Issue 化してから実装。優先は Tier A 完了後に再整理。

### オペレーター向けドキュメント

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | Admin 内 Help / Docs | ✅ #117 + #149（LLM 設定・会話ログの節を追記） |
| P2 | 公開説明書 | ✅ #150 — [`docs/operations/operator-guide.md`](../operations/operator-guide.md) |

### コンテンツ取り込み・管理

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **テキスト直接入力** | ✅ #115 — 「テキスト入力」タブ + `POST /admin/sources` (`source_type: text`) |
| P2 | **ドキュメント一覧・編集・削除** | ✅ #153 — ソース配下のドキュメント CRUD + チャンク再生成 |
| P2 | チャンクプレビュー | ✅ #155 — ドキュメント選択時に検索チャンクを read-only 表示 |

**ドキュメント Admin UX（#153/#155 フォロー — Issue 化してから。次セッション以降）**

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P2 | **ソース表・一覧の折り返し** | ✅ #159 — `break-all min-w-0 max-w-xs` / `break-words` でソース名・ドキュメントタイトルの折り返し対応 |
| P2 | **ドキュメント一覧ページング** | ✅ #160 — PAGE_SIZE=50 / offset 制御 / prev・next ボタン |
| P2 | **ドキュメント検索（ソース内）** | ✅ #160 — タイトル LIKE 検索フォーム（AbortController パターン） |
| P2 | **編集 UI をモーダル/ドロワー化** | 行展開 + 右ペインだと行数が多いとき編集フォームが画面下に出て DX が悪い。モーダルまたはサイドドロワーで一覧位置を維持 |

### Widget / チャット UX

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **HERO / ウェルカム** | ✅ #146 ほか — Appearance HERO 設定 |
| P1 | **吹き出し UI** | ✅ #133 — tail・レイアウト、`user_avatar_mode` |
| P2 | **CSS アニメーション UX** | ✅ #165 — prefers-reduced-motion 対応追加・scrollTo 改善（typing indicator・bubble-in・smooth scroll はすでに実装済みだった） |
| P2 | **アバター登録** | ✅ #134 — アシスタント画像アップロード |
| P2 | **カスタム CSS** | WordPress 系向け。widget スコープ限定・サニタイズ必須 |

### 会話ログ・監査

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P2 | **セッション metadata** | ✅ #129 |

### オペレーター設定

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **LLM API キー管理 UI** | ✅ #130 — マスク表示・接続テスト・`.env` 更新（ADR 0004） |
| P2 | **プロンプト / スコープ / フォールバック設定** | ✅ #163 — カスタムシステムプロンプト・フォールバックメッセージ UI（ChatSettingsPanel） |

**チャット transport:** **sync JSON chat** のみ。**SSE / token ストリーミングは非ゴール**（Tier A/B 共通）。

---

## 非ゴール（再確認）

| 項目 | 方針 |
| --- | --- |
| SSE streaming | 実装しない。FAQ 低頻度トラフィック向けに sync JSON + ローディング/CSS で十分 |

---

## 設計原則（再掲）

> **NeNe Records とは完全に分離。** 依存方向は `NeNe Corpus → NeNe Records API` のみ。
> 詳細: [`docs/adr/0002-separate-from-nene-records.md`](../adr/0002-separate-from-nene-records.md)

> **デュアルデプロイ:** Tier A = PHP 共用ホスティング + 1行 embed / Tier B = Docker・VPS。同一 API。
> 詳細: [`docs/adr/0003-dual-deployment-and-embed-widget.md`](../adr/0003-dual-deployment-and-embed-widget.md)

---

## Verification

```bash
composer check
npm run check --prefix frontend
docker compose up --build -d
curl -fsS http://localhost:8080/health
curl -fsS http://localhost:8080/openapi.php
```

NENE2 path dependency: see [`docs/development/docker.md`](../development/docker.md#path-dependency-nene2).
