# Backend Standards

NeNe Corpus backend policy for PHP API code. This document adapts [NeNe Records backend standards](https://github.com/hideyukiMORI/nene-records/blob/main/docs/development/backend-standards.md) for a **knowledge chat OSS** on NENE2.

**Framework baseline:** NENE2 `docs/development/` — deviate only via local ADR.

---

## 1. Project shape

NeNe Corpus is a **NENE2 consumer project**:

```
vendor/hideyukimori/nene2/   ← framework (do not edit)
src/                         ← product code (NeneCorpus\)
tests/                       ← mirrors src/
docs/openapi/openapi.yaml    ← public contract
public_html/index.php        ← front controller
```

Namespace: `NeneCorpus\`

---

## 2. Module layout (domain-grouped)

Organize by **domain**, not technical layer:

```
src/
  ApplicationServiceProvider.php
  Http/
    RuntimeContainerFactory.php
    RuntimeServiceProvider.php
  Ingestion/          # upload, parse triggers
  Source/             # source file metadata
  Document/           # logical documents
  Chunk/              # searchable text segments
  Chat/               # send message (sync JSON; SSE optional Tier B)
  Session/            # consumer sessions
  Message/            # chat messages
  Search/             # full-text over chunks
  Llm/                # Claude orchestration (no HTTP in UseCase)
  RateLimit/
  Upstream/           # NeNe Records HTTP client
  AdminAuth/          # admin JWT (Phase 1+)
```

**Zero-tolerance placement:** handlers live in their domain folder (`Chat/SendMessageHandler.php`), not `src/Handlers/`.

---

## 3. Layering rules

```
Handler → UseCase → RepositoryInterface → PdoRepository
```

| Layer | May | Must not |
| --- | --- | --- |
| **Handler** | Parse HTTP, build DTO, call UseCase, map JSON response (or SSE when enabled) | SQL, business rules, direct LLM calls |
| **UseCase** | Business rules, orchestration | `$_SERVER`, PDO, raw HTTP to Claude |
| **Repository** | SQL / persistence | HTTP, session logic |
| **Llm adapter** | Call Claude API from infrastructure | Domain invariants |

Use `final readonly` classes and `declare(strict_types=1);` in every PHP file.

---

## 4. HTTP & OpenAPI

- Every public route appears in `docs/openapi/openapi.yaml` with `operationId`.
- Success and Problem Details error shapes documented.
- Chat: document **sync JSON** contract first (ADR 0003 — default for Tier A and Tier B).
- Optional SSE: document in OpenAPI when implemented (Tier B polish).
- RFC 9457 Problem Details for errors; base URL `https://nene-corpus.dev/problems/`.

---

## 5. Security

- **Admin routes:** JWT Bearer (Phase 1+).
- **Consumer chat:** anonymous session token or separate session JWT — never admin JWT.
- **LLM:** `ANTHROPIC_API_KEY` in env only; never log prompts containing secrets.
- **Uploads:** validate MIME/size; store outside web root (`storage/uploads/`).
- **Prompt injection:** treat user message as untrusted; scope tools to corpus search only.
- **Rate limits:** enforce in middleware or dedicated UseCase before LLM calls.

See `docs/review/middleware-security.md`.

---

## 6. Database

- Phinx migrations in `database/migrations/`.
- Snapshot SQL in `database/schema/` after schema changes.
- Local dev: SQLite default; MySQL via Docker Compose.
- No raw SQL outside `Pdo*Repository` classes.

Expected tables (Phase 1+):

- `sources`, `documents`, `chunks`
- `chat_sessions`, `chat_messages`
- `rate_limit_buckets` (or equivalent)

---

## 7. Upstream clients

NeNe Records and other CMS APIs are accessed only via `Upstream/` adapters implementing interfaces. No shared database. See ADR 0002 and `docs/integrations/nene-records-client.md`.

---

## 8. MCP

- Catalog: `docs/mcp/tools.json`
- Validate: `composer mcp`
- Phase 0: read-only ops tools (e.g. health)
- Consumer chat UI **never** uses MCP — LLM tool_use is server-internal

---

## 9. Testing

- UseCase tests: in-memory repositories, no DB.
- Repository tests: SQLite.
- HTTP tests: exercise handlers through runtime or narrow integration tests.
- OpenAPI contract tests in `tests/OpenApi/`.

Naming: `test_{behavior}_when_{condition}`

---

## 10. Quality gate

```bash
composer check   # test + phpstan + cs + openapi + mcp
```

PHPStan level 8. PHP-CS-Fixer PSR-12 + strict_types.

---

## 11. Language

- Code identifiers, OpenAPI, public error titles: **English**
- Commit description/body: **Japanese** (per commit conventions)
