# Naming Conventions

Authoritative naming rules for NeNe Corpus code, API contracts, database objects, tests, and English documentation.

**Glossary (product terms):** [`docs/explanation/glossary.md`](../explanation/glossary.md)

**Reserved (not defined here):** product name vs repository slug vs namespace branding — tracked separately; do not invent alternate spellings until that policy lands.

**Framework baseline:** NENE2 [`domain-layer.md`](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/domain-layer.md) and [`database-migrations.md`](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/database-migrations.md). This document is the NeNe Corpus override and extension list.

---

## 1. PHP

### Files and namespaces

| Item | Rule | Example |
| --- | --- | --- |
| Namespace root | `NeneCorpus\` | `NeneCorpus\Chat\SendMessageHandler` |
| Domain folder | PascalCase singular domain name | `src/Chat/`, `src/RateLimit/` |
| File name | Match the primary class | `SendMessageHandler.php` |
| One public class per file | Required | — |

### Classes and interfaces

| Role | Pattern | Example |
| --- | --- | --- |
| HTTP handler | `{Verb}{Noun}Handler` | `SendMessageHandler`, `ListSourcesHandler` |
| Use case interface | `{Verb}{Noun}UseCaseInterface` | `SendMessageUseCaseInterface` |
| Use case impl | `{Verb}{Noun}UseCase` | `SendMessageUseCase` |
| Use case method | Always `execute` | `execute(SendMessageInput $input): SendMessageOutput` |
| Input DTO | `{Verb}{Noun}Input` | `SendMessageInput` |
| Output DTO | `{Verb}{Noun}Output` | `SendMessageOutput` |
| Domain entity | Singular noun, no suffix | `Chunk`, `Source`, `ChatSession` |
| Repository interface | `{Entity}RepositoryInterface` | `ChunkRepositoryInterface` |
| PDO repository | `Pdo{Entity}Repository` | `PdoChunkRepository` |
| LLM adapter | `{Provider}{Purpose}Client` or `{Purpose}LlmClient` in `Llm/` | `ClaudeToolUseClient` |
| Domain exception | `{Entity}{Reason}Exception` | `ChunkNotFoundException` |
| Service provider | `{Purpose}ServiceProvider` | `RuntimeServiceProvider` |

All application classes: `final` and `readonly` where applicable. Every PHP file: `declare(strict_types=1);`.

### Modules (`src/`)

Use only domain-grouped top-level folders defined in [`backend-standards.md`](./backend-standards.md). Do not add layer folders (`Handlers/`, `Repositories/`, `UseCases/`).

| Folder | Code symbol | Prose term |
| --- | --- | --- |
| `Llm/` | `Llm` namespace segment | **LLM** (concept) or **Claude API** (service) |
| `RateLimit/` | `RateLimit` namespace segment | **rate limit** |

### Methods and properties

| Item | Rule | Example |
| --- | --- | --- |
| Methods | camelCase | `findById`, `existsByName` |
| Properties | camelCase | `$sessionId`, `$chunkRepository` |
| Constants | UPPER_SNAKE_CASE | `MAX_UPLOAD_BYTES` |

Repository methods use **domain verbs**, not SQL verbs: `findById`, `save`, `delete` — not `selectById`, `insertRow`.

---

## 2. HTTP routes and OpenAPI

### URL paths

| Item | Rule | Example |
| --- | --- | --- |
| Path segments | lowercase **kebab-case** | `/admin/sources`, `/chat/messages` |
| Collection paths | plural noun | `/chat/sessions`, `/chunks` |
| Single resource | `{id}` path param | `/admin/sources/{id}` |
| Path param name | lowercase singular | `id`, `sessionId` |
| Query params | lowercase; multi-word **snake_case** | `limit`, `source_id` |
| File endpoints | noun, not verb | `/health` (system exception) |

Admin mutating routes live under `/admin/…`. Consumer chat routes under `/chat/…` (Phase 2+).

### operationId

| Item | Rule | Example |
| --- | --- | --- |
| Case | camelCase | `getHealth`, `sendChatMessage` |
| Shape | `{verb}{Resource}` or `{verb}{Resource}ById` | `listSources`, `getSourceById`, `createChatMessage` |
| Verbs | `get`, `list`, `create`, `update`, `delete`, `send` (chat) | — |
| Stability | Never rename after release; deprecate instead | — |

Must match between `docs/openapi/openapi.yaml`, route registration, and `docs/mcp/tools.json` `operationId`.

### OpenAPI schema names

| Item | Rule | Example |
| --- | --- | --- |
| Response schema | `{Resource}Response` | `ChatMessageResponse` |
| List response | `{Resource}ListResponse` with `items`, `limit`, `offset` | `SourceListResponse` |
| Create request | `Create{Resource}Request` | `CreateSourceRequest` |
| Update request | `Update{Resource}Request` | `UpdateSourceRequest` |
| Tag names | PascalCase singular group | `System`, `Admin`, `Chat`, `Ingestion` |

Public OpenAPI summaries, descriptions, and examples: **English only**.

---

## 3. JSON (request and response bodies)

| Item | Rule | Example |
| --- | --- | --- |
| Property names | **snake_case** | `document_id`, `created_at`, `session_id` |
| Single-word fields | lowercase English word | `id`, `status`, `body`, `title`, `items` |
| Booleans | `is_` / `has_` prefix | `is_deleted`, `has_citations` |
| Timestamps | `_at` suffix, ISO 8601 string | `created_at`, `updated_at` |
| Foreign keys in JSON | `{entity}_id` | `source_id`, `chunk_id` |
| List envelope | `items`, `limit`, `offset` | Same as NENE2 list pattern |
| Chat citation object | `citations` array; each item includes `document_id`, `chunk_id`, and optional `page`, `section`, `excerpt` | Phase 2 contract |

Do not mix camelCase in public JSON. Widget and admin UI must consume snake_case API fields as documented.

---

## 4. Problem Details and validation errors

| Item | Rule | Example |
| --- | --- | --- |
| Base URL | `https://nene-corpus.dev/problems/` | — |
| Type slug | kebab-case | `validation-failed`, `rate-limit-exceeded`, `source-not-found` |
| Full type URI | base + slug | `https://nene-corpus.dev/problems/source-not-found` |
| Validation `errors[].field` | snake_case path | `body.email`, `query.limit` |
| Validation `errors[].code` | snake_case | `required`, `invalid_mime_type` |

Problem Details `title` and `detail`: English. See [`backend-standards.md`](./backend-standards.md) §4.

---

## 5. Database

| Item | Rule | Example |
| --- | --- | --- |
| Table names | snake_case, **plural** | `sources`, `documents`, `chunks`, `chat_sessions`, `chat_messages`, `rate_limit_buckets` |
| Column names | snake_case | `source_id`, `created_at`, `is_deleted` |
| Primary key | `id` | `BIGINT` / `INTEGER` auto-increment |
| Foreign key column | `{singular_entity}_id` | `document_id`, `session_id` |
| Index names | `idx_{table}_{columns}` | `idx_chunks_source_id` |
| Unique constraints | `uniq_{table}_{columns}` | `uniq_sources_path` |

SQL lives only in `Pdo*Repository` classes. No table or column names in handlers or use cases except as mapped domain properties.

### Migrations

| Item | Rule | Example |
| --- | --- | --- |
| File name | `YYYYMMDDHHMMSS_snake_description.php` | `20260525120000_create_sources_table.php` |
| Class name | Phinx PascalCase derived from description | `CreateSourcesTable` |
| Snapshot file | `database/schema/{table}.sql` | `database/schema/sources.sql` |

See [`docs/review/database.md`](../review/database.md).

---

## 6. Environment variables

| Item | Rule | Example |
| --- | --- | --- |
| Names | UPPER_SNAKE_CASE | `ANTHROPIC_API_KEY`, `DB_HOST` |
| Prefix | Product-specific vars may use `NENE_CORPUS_` for compose overrides | `NENE_CORPUS_PORT` |
| Secrets | Never commit; document only in `.env.example` with empty value | — |

---

## 7. Tests

| Item | Rule | Example |
| --- | --- | --- |
| Test class | `{ClassUnderTest}Test` | `SendMessageUseCaseTest` |
| Test method | `test_{behavior}_when_{condition}` | `test_returns_citations_when_chunks_match` |
| Test namespace | Mirror `src/` under `tests/` | `tests/Chat/SendMessageUseCaseTest.php` |

---

## 8. MCP tools

| Item | Rule | Example |
| --- | --- | --- |
| Tool `name` | Same as OpenAPI `operationId` | `getHealth` |
| Tool `title` | Short English Title Case | `Health` |
| `safety` | `read` or `write` | Phase 0+ ops: prefer `read` |

Catalog: `docs/mcp/tools.json`. Validate with `composer mcp`.

---

## 9. Frontend (Phase 3+)

Policy lands with `frontend/`. Until then, reserve:

| Item | Rule |
| --- | --- |
| Components | PascalCase file and export (`EmbedWidget.tsx`) |
| Hooks | camelCase with `use` prefix (`useChatSession`) |
| API client | Maps snake_case JSON to typed TS interfaces; do not rename API fields in transit |
| Embed bundle | **`widget.js`** (fixed public file name) |
| CSS | BEM-style or scoped modules; prefix block with `nene-corpus-` to avoid host site collisions |

Full frontend standards: **`docs/development/frontend-standards.md`** (Phase 3).

---

## 10. Documentation and commits

| Surface | Language | Naming |
| --- | --- | --- |
| Public docs, OpenAPI, API errors | English | Use glossary canonical terms |
| Issues, PRs, commit bodies | Japanese allowed | Prefer glossary English term on first mention |
| Commit subject | Conventional Commits + `(#issue)` | See [`commit-conventions.md`](./commit-conventions.md) |
| ADR file | `NNNN-kebab-title.md` | `0003-dual-deployment-and-embed-widget.md` |

When adding a new public term, update [`glossary.md`](../explanation/glossary.md) in the same PR.

---

## 11. Prohibited patterns

- Layer-first folders (`src/Handlers/`, `src/Repositories/`)
- SQL outside `Pdo*Repository`
- camelCase in public JSON property names
- Renaming shipped `operationId` values
- New synonyms for glossary terms in English docs (e.g. do not write "streaming chat" for **sync JSON chat** or widget CSS motion; do not write "synchronous JSON" when the doc means **sync JSON chat**)
- MCP tools exposed to **embed widget** or consumer chat clients

---

## Verification

```bash
composer check
composer openapi
composer mcp
```

Review checklists: [`docs/review/`](../review/) — cite `Self-review: openapi-contract`, `database`, or `docs-policy` as applicable.
