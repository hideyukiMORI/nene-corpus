# Current Work

Last updated: 2026-05-25

## 状態サマリー

**Phase 0 — Governance & Foundation: 進行中**

リポジトリ初期化完了。Runtime scaffold + CI セットアップ中。

---

## Phase 0 タスク

| 優先 | 項目 | 状態 |
| --- | --- | --- |
| P0 | ガバナンス docs（AGENTS, ADR, inheritance, Cursor rules） | ✅ |
| P0 | NENE2 consumer scaffold + `GET /health` | 🔄 |
| P0 | OpenAPI + MCP 最小契約 + `composer check` | 🔄 |
| P0 | Backend CI (GitHub Actions) | 🔄 |
| P1 | Issue #1 起票 → 初回 PR | 待ち |

---

## Up Next — Phase 1（Corpus & Ingestion）

| 優先 | 項目 | 説明 |
| --- | --- | --- |
| P0 | Schema: sources, documents, chunks | 取り込み正本 |
| P0 | Admin auth (JWT) | 管理 API 保護 |
| P1 | CSV upload API | 列マッピング preview |
| P1 | PDF text extraction | テキスト PDF のみ（Phase 1） |
| P2 | Reindex / delete source | 運用 API |

詳細は [`docs/roadmap.md`](../roadmap.md)。

---

## Up Next — Phase 2（Chat）

| 優先 | 項目 | 説明 |
| --- | --- | --- |
| P0 | Sessions + messages | 会話永続化 |
| P0 | Chunk search | full-text |
| P0 | Claude tool_use + citations | サーバー側のみ |
| P1 | SSE streaming | コンシューマー向け |
| P1 | Rate limiting | session / IP |

---

## 設計原則（再掲）

> **NeNe Records とは完全に分離。** 依存方向は `NeNe Corpus → NeNe Records API` のみ。
> 詳細: [`docs/adr/0002-separate-from-nene-records.md`](../adr/0002-separate-from-nene-records.md)

---

## Verification

```bash
composer check
docker compose up --build -d
curl -fsS http://localhost:8080/health
curl -fsS http://localhost:8080/openapi.php
```
