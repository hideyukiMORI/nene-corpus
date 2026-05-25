# NeNe Corpus

[![Backend CI](https://github.com/hideyukiMORI/nene-corpus/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/hideyukiMORI/nene-corpus/actions/workflows/backend-ci.yml)
[![PHP 8.4](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php)](https://www.php.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-85EA2D?logo=swagger)](./docs/openapi/openapi.yaml)

**Ingest your documents. Chat with citations. Keep everything on your stack.**

NeNe Corpus is a self-hosted, open-source knowledge chat platform built on [NENE2](https://github.com/hideyukiMORI/NENE2). Upload PDF and CSV, build a searchable corpus, and answer end-user questions with source citations — without sending your data to a SaaS vendor.

**Primary audience:** Japan SMB on **Tier A** **shared hosting** — add a **cited search assistant** to an existing homepage with one script tag (catalog-heavy makers, regional brands, FAQ sites). **Also:** **Tier B** developers and VPS operators via Docker Compose (**dual deployment** — ADR 0003).

> **Example operator:** a non-engineer staff member on shared hosting uploads product PDFs, enables the **embed widget**, and pays for **Claude API** usage instead of a chatbot subscription — see [`docs/explanation/product-vision.md`](./docs/explanation/product-vision.md#primary-persona).

## Goals

- **Self-hosted OSS** — MIT licensed; shared hosting or VPS/private cloud
- **Cited answers** — every response links back to document chunks
- **Easy embed** — one `<script>` for the **embed widget** on same-origin pages (Phase 3)
- **Secure by design** — audit logs, tenant boundaries, no DB bypass for AI tools
- **AI-readable** — OpenAPI contract, MCP for ops, explicit Clean Architecture
- **Sibling to NeNe Records** — optional CMS upstream; never merged into the CMS repo

## Quick Start

### Docker — developers and VPS (Tier B)

```bash
git clone https://github.com/hideyukiMORI/nene-corpus.git
cd nene-corpus
cp .env.example .env
docker compose up --build -d
curl -fsS http://localhost:8080/health
```

> See [`docs/development/docker.md`](./docs/development/docker.md) for full setup details.

### Shared hosting — Japan SMB (Tier A)

Web installer and release ZIP ship in Phase 3. Requirements and planned flow:

> [`docs/deployment/shared-hosting.md`](./docs/deployment/shared-hosting.md)

## Architecture

```
Existing homepage      ──→  <script widget.js>  ──┐
Admin UI (React)       ────────────────────────────┼──→  NeNe Corpus API (NENE2)  ──→  Corpus DB
Ops / AI (MCP)         ────────────────────────────┘              │
                                                                 ↓ (optional read-only HTTP)
                                                         NeNe Records / other upstream APIs
                                                                 ↓
                                                         Claude API (tool_use — server-side only)
```

- **Backend**: PHP 8.4, NENE2, Handler → UseCase → Repository
- **API contract**: OpenAPI 3.1 ([`docs/openapi/openapi.yaml`](./docs/openapi/openapi.yaml))
- **Ingestion**: PDF text extraction, CSV row mapping (planned)
- **Chat**: **sync JSON chat** + citations, rate limits (**SSE streaming** optional on Tier B — planned)
- **Deploy**: dual path — [`docs/deployment/README.md`](./docs/deployment/README.md)

## Current Status

**Phase 0 — Governance & Foundation: complete (2026-05-25)**

| Area | State |
| --- | --- |
| Governance docs | ADR 0001/0002/0003, inheritance map, Cursor rules |
| Runtime scaffold | NENE2 consumer, `GET /health`, CI |
| Ingestion API | Planned (Phase 1) |
| Chat + citations | Planned (Phase 2) |
| Admin UI + embed widget + Tier A installer | Planned (Phase 3) |

See [`docs/roadmap.md`](./docs/roadmap.md) and [`docs/todo/current.md`](./docs/todo/current.md).

## Non-goals

- Not a Notion / Slack replacement
- Not a WordPress **plugin** (coexist on same domain is fine)
- Not embedded inside [NeNe Records](https://github.com/hideyukiMORI/nene-records)
- Not exposing MCP protocol to end-user chat clients
- Not Docker-only (shared hosting is a first-class deployment target)

## Contributing

| Topic | Document |
| --- | --- |
| **Product vision** | [`docs/explanation/product-vision.md`](./docs/explanation/product-vision.md) |
| **Glossary** | [`docs/explanation/glossary.md`](./docs/explanation/glossary.md) |
| **Naming conventions** | [`docs/development/naming-conventions.md`](./docs/development/naming-conventions.md) |
| **Deployment** | [`docs/deployment/README.md`](./docs/deployment/README.md) |
| **Start here (agents)** | [`AGENTS.md`](./AGENTS.md) |
| NENE2 inheritance map | [`docs/inheritance-from-nene2.md`](./docs/inheritance-from-nene2.md) |
| Workflow | [`docs/workflow.md`](./docs/workflow.md) |
| Commit conventions | [`docs/development/commit-conventions.md`](./docs/development/commit-conventions.md) |
| Coding standards | [`docs/development/coding-standards.md`](./docs/development/coding-standards.md) |
| Docker development | [`docs/development/docker.md`](./docs/development/docker.md) |
| Shared hosting | [`docs/deployment/shared-hosting.md`](./docs/deployment/shared-hosting.md) |
| Full contributing guide | [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) |

Work from GitHub Issues. Do not commit directly to `main`.

## License

MIT — see [LICENSE](./LICENSE).

## Related Projects

| Project | Role |
| --- | --- |
| [NENE2](https://github.com/hideyukiMORI/NENE2) | Framework runtime |
| [NeNe Records](https://github.com/hideyukiMORI/nene-records) | Optional CMS upstream |
| [nene-mcp](https://github.com/hideyukimori/nene-mcp) | Generic MCP bridge (reference) |
