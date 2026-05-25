# Roadmap

NeNe Corpus is a self-hosted knowledge chat OSS on NENE2 — ingest documents, chat with citations, keep data on your stack.

## North Star

Operators can self-host a corpus + chat platform that:

- ingests PDF and CSV into searchable, citable chunks
- answers consumer questions with source references
- provides admin UI for uploads, logs, and configuration
- embeds **embed widget** on an **existing homepage** with one script tag (**same origin**)
- optionally queries [NeNe Records](https://github.com/hideyukiMORI/nene-records) via read-only HTTP

**Primary market:** Japan SMB on **Tier A** **shared hosting**. **Dual deployment:** Tier A and Tier B — ADR 0003. Terms: [`glossary.md`](./explanation/glossary.md).

## Phase 0: Governance and Foundation

Goal: engineering discipline and minimal runtime scaffold.

- Governance docs, ADR 0001/0002, inheritance map
- NENE2 consumer scaffold, `GET /health`, OpenAPI, CI
- Cursor rules and self-review checklists

Tracked by `docs/milestones/2026-05-governance-and-foundation.md`.

**Status: complete (2026-05-25).**

## Phase 1: Corpus Storage & Ingestion

Goal: store documents and chunks; admin upload API.

- `sources`, `documents`, `chunks` schema
- CSV upload + column mapping preview
- PDF text extraction (text PDF first)
- Admin auth (JWT) for mutating routes
- OpenAPI + tests
- Tier A: MySQL on shared hosting; consider PHP 8.2+ floor for host compatibility

## Phase 2: Chat & Citations

Goal: grounded Q&A with cited responses.

- Chat sessions and messages
- Full-text search over chunks
- Claude tool_use orchestration (server-side)
- **sync JSON chat** endpoint (default for Tier A and Tier B)
- **Citation** payload in responses
- **Rate limit** per session/IP
- **sync JSON chat** only — consumer UX via widget CSS (loading, bubble motion, scroll). **SSE streaming is a non-goal** (see ADR 0003 note in `docs/todo/current.md`)

## Phase 3: Admin UI & Widget

Goal: operable product without curl; Tier A install path.

- React admin: sources, ingestion status, conversation logs
- **Embeddable embed widget** (`widget.js` + snippet for **same origin** pages)
- Prompt / scope / fallback settings UI — **Phase 3+**（未着手）
- **Tier A deliverables:** **web installer**, **release ZIP** (vendor bundled), shared-hosting operator docs

**Status: complete (2026-05-25).** Milestone: [`milestones/2026-05-admin-ui-and-widget.md`](./milestones/2026-05-admin-ui-and-widget.md).

## Phase 3+: Operator UX & settings (backlog)

Goal: day-2 operations without SSH or hosting-panel `.env` edits where possible.

- **Conversation log metadata** — client IP, User-Agent (optional referer) on session create; admin detail view; privacy/retention notes
- **LLM API key management** — rotate or switch Anthropic account from Admin (installer is first-time only today); masked key, test-before-save, never expose full secret in API responses
- **Prompt / scope / fallback settings UI** — deferred from Phase 3 roadmap line
- Widget UX polish (HERO, bubbles, CSS motion) — see [`todo/current.md`](./todo/current.md)

Issue 化してから実装。詳細バックログ: [`docs/todo/current.md`](./todo/current.md) § Phase 3+.

## Phase 4: Upstream Integrations

Goal: optional NeNe Records and export APIs.

- NeNe Records read-only client
- Unified search across local corpus + upstream
- Webhook or poll reindex hooks

## Deployment tiers

| Tier | Phase | Deliverable |
| --- | --- | --- |
| **Tier B — Docker / VPS** | 0 (now) | `docker compose up`, `docs/development/docker.md` |
| **Tier A — shared hosting** | 3 ✅ | **web installer**, **release ZIP**, [`docs/deployment/shared-hosting.md`](./deployment/shared-hosting.md) |

Same API and **embed widget** for both tiers. Chat uses **sync JSON chat** by default.

## Non-goals

- Notion / Slack replacement
- WordPress **plugin** (coexist on same domain is supported)
- Embedding inside NeNe Records
- Consumer-facing MCP
- Mandatory SaaS hosting
- Docker-only deployment

## Ecosystem

```
NENE2 (framework)
  ├── nene-records (CMS — optional upstream)
  └── nene-corpus (knowledge chat — this repo)
```

Framework changes → NENE2. CMS → nene-records. Chat/corpus → here.

## Related

- ADR 0003: dual deployment and embed widget
- Deployment: `docs/deployment/README.md`
- Product vision: `docs/explanation/product-vision.md`
- Glossary: `docs/explanation/glossary.md`
- Naming: `docs/development/naming-conventions.md`
