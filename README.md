# NeNe Corpus

[![Backend CI](https://github.com/hideyukiMORI/nene-corpus/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/hideyukiMORI/nene-corpus/actions/workflows/backend-ci.yml)
[![PHP 8.4](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php)](https://www.php.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-85EA2D?logo=swagger)](./docs/openapi/openapi.yaml)

**Ingest your documents. Chat with citations. Keep everything on your stack.**

NeNe Corpus is a self-hosted, open-source knowledge chat platform built on [NENE2](https://github.com/hideyukiMORI/NENE2). Upload PDF and CSV, build a searchable corpus, and answer end-user questions with source citations — without sending your data to a SaaS vendor.

## Goals

- **Self-hosted OSS** — MIT licensed; run on your VPS or private cloud
- **Cited answers** — every response links back to document chunks
- **Secure by design** — audit logs, tenant boundaries, no DB bypass for AI tools
- **AI-readable** — OpenAPI contract, MCP for ops, explicit Clean Architecture
- **Sibling to NeNe Records** — optional CMS upstream; never merged into the CMS repo

## Quick Start

```bash
git clone https://github.com/hideyukiMORI/nene-corpus.git
cd nene-corpus
cp .env.example .env
docker compose up --build -d
curl -fsS http://localhost:8080/health
```

> See [`docs/development/docker.md`](./docs/development/docker.md) for full setup details.

## Architecture

```
Admin UI (React)     ──┐
Consumer chat widget ──┼──→  NeNe Corpus API (NENE2)  ──→  Corpus DB
Ops / AI (MCP)       ──┘              │
                                      ↓ (optional read-only HTTP)
                              NeNe Records / other upstream APIs
                                      ↓
                              Claude API (tool_use — server-side only)
```

- **Backend**: PHP 8.4, NENE2, Handler → UseCase → Repository
- **API contract**: OpenAPI 3.1 ([`docs/openapi/openapi.yaml`](./docs/openapi/openapi.yaml))
- **Ingestion**: PDF text extraction, CSV row mapping (planned)
- **Chat**: SSE streaming, rate limits, session audit (planned)

## Current Status

**Phase 0 — Governance & Foundation: in progress**

| Area | State |
| --- | --- |
| Governance docs | ADR 0001/0002, inheritance map, Cursor rules |
| Runtime scaffold | NENE2 consumer, `GET /health`, CI |
| Ingestion API | Planned (Phase 1) |
| Chat + citations | Planned (Phase 2) |
| Admin UI | Planned (Phase 3) |

See [`docs/roadmap.md`](./docs/roadmap.md) and [`docs/todo/current.md`](./docs/todo/current.md).

## Non-goals

- Not a Notion / Slack replacement
- Not WordPress-compatible
- Not embedded inside [NeNe Records](https://github.com/hideyukiMORI/nene-records)
- Not exposing MCP protocol to end-user chat clients

## Contributing

| Topic | Document |
| --- | --- |
| **Product vision** | [`docs/explanation/product-vision.md`](./docs/explanation/product-vision.md) |
| **Start here (agents)** | [`AGENTS.md`](./AGENTS.md) |
| NENE2 inheritance map | [`docs/inheritance-from-nene2.md`](./docs/inheritance-from-nene2.md) |
| Workflow | [`docs/workflow.md`](./docs/workflow.md) |
| Commit conventions | [`docs/development/commit-conventions.md`](./docs/development/commit-conventions.md) |
| Coding standards | [`docs/development/coding-standards.md`](./docs/development/coding-standards.md) |
| Docker development | [`docs/development/docker.md`](./docs/development/docker.md) |
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
