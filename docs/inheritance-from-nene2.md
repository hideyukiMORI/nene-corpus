# Inheritance from NENE2

NeNe Corpus inherits engineering governance from [NENE2](https://github.com/hideyukiMORI/NENE2). This document is the source of truth for what is inherited, what is adapted, and what is NeNe Corpus–specific.

## Relationship

| Layer | Repository | Role |
| --- | --- | --- |
| Framework runtime | [NENE2](https://github.com/hideyukiMORI/NENE2) | HTTP runtime, DI, middleware, Problem Details, OpenAPI/MCP patterns |
| Knowledge chat product | **NeNe Corpus** (this repo) | Ingestion, corpus, chat, admin, consumer widget |
| CMS upstream (optional) | [NeNe Records](https://github.com/hideyukiMORI/nene-records) | Structured content API — **client only**, never embedded here |
| Reference trials | [NENE2-FT](https://github.com/hideyukiMORI/NENE2-FT) | Patterns and friction notes from field trials |

NeNe Corpus is a **consumer project**, not a fork of NENE2. Framework code stays in NENE2; product code stays here.

## Inherited by policy (same rules)

| Topic | Local document |
| --- | --- |
| Issue-driven workflow | `docs/workflow.md` (inherits [NENE2 workflow](https://github.com/hideyukiMORI/NENE2/blob/main/docs/workflow.md)) |
| Conventional Commits | `docs/development/commit-conventions.md` (inherits [NENE2 commit conventions](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/commit-conventions.md)) |
| Self-review before PR | `docs/development/self-review.md` |
| ADR operation | `docs/development/adr.md` |
| AI agent workflow | `docs/integrations/ai-tools.md`, `AGENTS.md` |
| Cursor summaries | `.cursor/rules/` |

## Inherited by reference (framework behavior)

| Topic | NENE2 upstream |
| --- | --- |
| HTTP runtime (PSR-7/15/17) | `docs/development/http-runtime.md` |
| Middleware order and security | `docs/development/middleware-security.md` |
| Request validation layers | `docs/development/request-validation.md` |
| Problem Details errors | `docs/development/api-error-responses.md` |
| Authentication boundaries | `docs/development/authentication-boundary.md` |
| OpenAPI conventions | `docs/integrations/openapi.md` |
| MCP tool policy | `docs/integrations/mcp-tools.md`, `docs/explanation/why-mcp.md` |
| Database adapter boundaries | `docs/development/database-migrations.md` |
| Domain / use case layering | `docs/development/domain-layer.md` |

Install NENE2 as a Composer dependency and treat `vendor/hideyukimori/nene2/docs/` as the framework reference during development.

## Adapted for NeNe Corpus

| Topic | NeNe Corpus choice |
| --- | --- |
| Product goal | Self-hosted knowledge chat OSS (not CMS, not framework) |
| Public Problem Details base URL | `https://nene-corpus.dev/problems/` |
| Namespace | `NeneCorpus\` |
| Coding standards | `docs/development/coding-standards.md` — NENE2 baseline + chat domains |
| Backend standards | `docs/development/backend-standards.md` |
| Language policy | English for public docs, OpenAPI, API errors; Japanese allowed in Issues, PRs, commits, `.cursor/rules/` |
| Review checklists | `docs/review/` — task-specific lists for this product |
| Transport | REST JSON + SSE for chat streaming (Phase 2+) |
| External services | Claude API (server-side), optional NeNe Records HTTP client |

## NeNe Corpus–specific (not inherited)

Record these in ADRs or product docs when they stabilize:

- Document ingestion and chunking model
- Citation format in chat responses
- Session / message / rate-limit schema
- Admin auth vs anonymous consumer sessions
- LLM tool_use orchestration boundaries
- Upstream API client policy (ADR 0002)

## When upstream and local docs conflict

1. Update the **local source-of-truth doc** in this repository first.
2. If the conflict is about **framework behavior**, prefer NENE2 upstream unless an ADR documents a deliberate deviation.
3. Keep `.cursor/rules/` as a short summary; do not duplicate full policy text there.

## Verification commands

```bash
composer check
composer openapi
composer mcp
```

When `frontend/` exists:

```bash
npm run check --prefix frontend
```
