# Current Work

Last updated: 2026-05-25

## 最近の docs 更新

- Phase 1 完了 — corpus ingestion milestone (#7–#15)
- Phase 2 開始 — chat sessions/messages schema (#17), chunk search (#19)

## 状態サマリー

**Phase 1 — Corpus & Ingestion: 完了（2026-05-25）**

- ✅ Schema, Admin auth, CSV/PDF ingestion, Reindex/delete

**Phase 2 — Chat & Citations: 進行中（2026-05-25）**

- ✅ Sessions + messages schema（#17）
- 🔜 Chunk search（#19）
- 🔜 Sync JSON chat

`composer check` ローカル / GitHub Actions Backend CI ともに green。

---

## Phase 1 進捗

| 項目 | 状態 |
| --- | --- |
| Schema: sources, documents, chunks | ✅ (#7) |
| Admin auth (JWT) | ✅ (#9) |
| CSV upload API | ✅ (#11) |
| PDF text extraction | ✅ (#13) |
| Reindex / delete source | ✅ (#15) |

Milestone: [`docs/milestones/2026-05-corpus-ingestion.md`](../milestones/2026-05-corpus-ingestion.md)

---

## Phase 2 進捗

| 項目 | 状態 |
| --- | --- |
| Schema: chat_sessions, chat_messages | ✅ (#17) |
| Chunk search (full-text) | ✅ (#19) |
| Claude tool_use + citations | 🔜 |
| Sync JSON chat API | 🔜 |
| Rate limiting | 🔜 |

Milestone: [`docs/milestones/2026-05-chat-and-citations.md`](../milestones/2026-05-chat-and-citations.md)

---

## Phase 0 完了

| 項目 | 状態 |
| --- | --- |
| ガバナンス docs（AGENTS, ADR, inheritance, Cursor rules） | ✅ |
| NENE2 consumer scaffold + `GET /health` | ✅ |
| OpenAPI + MCP 最小契約 + `composer check` | ✅ |
| Backend CI (GitHub Actions) | ✅ |

---

## Up Next — Phase 1（Corpus & Ingestion）

**運用:** Issue → `type/issue-number-summary` ブランチ → PR → merge（`main` 直 push 禁止）。Phase 0 bootstrap のみ historical exception — `docs/workflow.md` 参照。

| 優先 | 項目 | 説明 |
| --- | --- | --- |
| ~~P0~~ | ~~Schema: sources, documents, chunks~~ | ✅ #7 |
| ~~P0~~ | ~~Admin auth (JWT)~~ | ✅ #9 |
| ~~P0~~ | ~~CSV upload API~~ | ✅ #11 |
| ~~P0~~ | ~~PDF text extraction~~ | ✅ #13 |
| ~~P2~~ | ~~Reindex / delete source~~ | ✅ #15 |

詳細は [`docs/roadmap.md`](../roadmap.md)。

---

## Up Next — Phase 2（Chat）

| 優先 | 項目 | 説明 |
| --- | --- | --- |
| ~~P0~~ | ~~Sessions + messages~~ | ✅ #17 |
| ~~P0~~ | ~~Chunk search~~ | ✅ #19 |
| P0 | Claude tool_use + citations | サーバー側のみ |
| P0 | Sync JSON chat API | Tier A/B 共通デフォルト（ADR 0003） — 用語: **sync JSON chat** |
| P1 | Rate limiting | session / IP — 用語: **rate limit** |
| P2 | SSE streaming | Tier B 任意 — 用語: **SSE streaming** |

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
docker compose up --build -d
curl -fsS http://localhost:8080/health
curl -fsS http://localhost:8080/openapi.php
```

NENE2 path dependency: see [`docs/development/docker.md`](../development/docker.md#path-dependency-nene2).
