# Roadmap

NeNe Corpus is a self-hosted knowledge chat OSS on NENE2 — ingest documents, chat with citations, keep data on your stack.

## North Star

Operators can self-host a corpus + chat platform that:

- ingests PDF and CSV into searchable, citable chunks
- answers consumer questions with source references
- provides admin UI for uploads, logs, and configuration
- optionally queries [NeNe Records](https://github.com/hideyukiMORI/nene-records) via read-only HTTP

## Phase 0: Governance and Foundation

Goal: engineering discipline and minimal runtime scaffold.

- Governance docs, ADR 0001/0002, inheritance map
- NENE2 consumer scaffold, `GET /health`, OpenAPI, CI
- Cursor rules and self-review checklists

Tracked by `docs/milestones/2026-05-governance-and-foundation.md`.

## Phase 1: Corpus Storage & Ingestion

Goal: store documents and chunks; admin upload API.

- `sources`, `documents`, `chunks` schema
- CSV upload + column mapping preview
- PDF text extraction (text PDF first)
- Admin auth (JWT) for mutating routes
- OpenAPI + tests

## Phase 2: Chat & Citations

Goal: grounded Q&A with streaming.

- Chat sessions and messages
- Full-text search over chunks
- Claude tool_use orchestration (server-side)
- SSE streaming consumer endpoint
- Citation payload in responses
- Rate limiting per session/IP

## Phase 3: Admin UI & Widget

Goal: operable product without curl.

- React admin: sources, ingestion status, conversation logs
- Embeddable consumer chat widget
- Prompt / scope / fallback settings UI

## Phase 4: Upstream Integrations

Goal: optional NeNe Records and export APIs.

- NeNe Records read-only client
- Unified search across local corpus + upstream
- Webhook or poll reindex hooks

## Non-goals

- Notion / Slack replacement
- WordPress compatibility
- Embedding inside NeNe Records
- Consumer-facing MCP
- Mandatory SaaS hosting

## Ecosystem

```
NENE2 (framework)
  ├── nene-records (CMS — optional upstream)
  └── nene-corpus (knowledge chat — this repo)
```

Framework changes → NENE2. CMS → nene-records. Chat/corpus → here.
