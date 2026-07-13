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
- **Easy embed** — **embed widget** on same-origin pages ([`docs/deployment/shared-hosting.md`](./docs/deployment/shared-hosting.md))
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
curl -fsS http://localhost:8989/health
```

> See [`docs/development/docker.md`](./docs/development/docker.md) for full setup details.

### Shared hosting — Japan SMB (Tier A)

1. Download the **release ZIP** and upload via FTP.
2. Run the **web installer** at `/install/`.
3. Manage corpus and chat from **Admin**; embed the widget on your existing site.

> [`docs/deployment/shared-hosting.md`](./docs/deployment/shared-hosting.md)

## Local ports

NeNe Corpus owns the **`89**` port lane**; sibling products use their own lanes so several apps can run locally side by side (full port table: [`CLAUDE.md`](./CLAUDE.md#ローカル開発ポート固定)). Override the Docker ports via `NENE_CORPUS_PORT` / `NENE_CORPUS_MYSQL_PORT` in `.env`.

| Service | Port |
| --- | --- |
| API / Web (Docker, Apache) | 8989 |
| MySQL (Docker) | 3389 |
| Vite admin SPA | 5289 |
| Vite widget | 5290 |

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
- **Ingestion**: PDF text extraction, CSV row mapping, plain-text direct input
- **Chat**: **sync JSON chat** + citations, rate limits; widget CSS for loading/motion UX
- **Deploy**: dual path — [`docs/deployment/README.md`](./docs/deployment/README.md)

## Status

Phases 1–4 core deliverables are complete, including multi-tenancy. See [`docs/roadmap.md`](./docs/roadmap.md) and [`docs/todo/current.md`](./docs/todo/current.md).

| Area | State |
| --- | --- |
| Corpus ingestion (PDF / CSV / plain text) + admin API | ✅ |
| Sync JSON chat + citations + rate limits | ✅ |
| Admin UI + embed widget (i18n 6 locales, custom CSS, avatar, HERO) | ✅ |
| Operator settings (LLM key, chat limits, notifications, appearance) | ✅ |
| Conversation analytics dashboard + CSV export | ✅ |
| Brute-force protection + password reset | ✅ |
| Admin E2E tests (comprehensive Playwright E2E suite) | ✅ |
| Tier A — installer + release ZIP + operator docs | ✅ |
| Phase 4 — multi-tenancy (organizations, single/subdomain/path tenant resolution, superadmin) | ✅ (2026-05-29) |
| Phase 5 — upstream integrations (NeNe Records) | 🔄 In progress |

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
