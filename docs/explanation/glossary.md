# Glossary

Canonical English terms for NeNe Corpus documentation, OpenAPI, code comments, and AI agent output.

**Naming rules (code, API, DB):** [`docs/development/naming-conventions.md`](../development/naming-conventions.md)

**Reserved:** product name vs repository slug vs filesystem path branding — not defined here; do not standardize alternate spellings until a dedicated policy Issue closes.

---

## How to use this glossary

1. In **English docs and OpenAPI**, use the **Canonical term** exactly. Synonyms listed under **Do not use** are forbidden in new text.
2. In **Issues and PRs (Japanese)**, you may use the **Japanese note** column on first mention, then the canonical English term in backticks.
3. Adding or changing a term requires updating this file in the same PR.

---

## Deployment and product shape

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **Tier A** | PHP **shared hosting** deployment path: ZIP upload, web installer, MySQL, FTP/SSH. Primary operator audience: Japan SMB. | ティア A / 共用ホスティング向け | "rental server tier", "hosting-only", "FTP tier" |
| **Tier B** | **Docker / VPS** deployment path: `docker compose up`, reproducible dev and production on controlled servers. | ティア B / Docker・VPS 向け | "cloud-only", "dev tier" (Tier B is also production) |
| **dual deployment** | Same codebase and API; Tier A and Tier B differ only in packaging, installer, and docs. ADR 0003. | デュアルデプロイ | "multi-deploy", "two products" |
| **shared hosting** | PHP-capable operator hosting (MySQL, FTP/file manager, no Docker required). Tier A target. | 共用ホスティング / レンタルサーバー（日本語 docs のみ） | "shared server", "mutual hosting" |
| **web installer** | Browser-based first-time setup (DB, admin account, keys). Tier A Phase 3 deliverable. | Web インストーラ | "setup wizard" (unless referring to the same UI) |
| **release ZIP** | Distribution archive with `vendor/` bundled for Tier A upload. | 配布 ZIP | "deployment pack", "hosting bundle" |

---

## Chat, widget, and transport

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **sync JSON chat** | Default consumer chat transport: HTTP POST → wait → single JSON body with message text and **citations**. Tier A and Tier B default. | 同期 JSON チャット | "synchronous JSON", "async chat", "REST polling" (unless describing a future job poll API) |
| **SSE streaming** | Optional Tier B enhancement: token-by-token Server-Sent Events stream. Not required for FAQ traffic. | SSE ストリーミング | "streaming chat" (ambiguous), "websocket chat" |
| **embed widget** | The `widget.js` bundle plus one same-origin `<script>` embed on an existing site. Phase 3. | 埋め込みウィジェット | "chat widget" alone, "plugin", "snippet" |
| **consumer chat** | End-user Q&A feature (sessions, messages, citations). Distinct from admin UI and MCP. | コンシューマーチャット | "user chatbot", "public bot" |
| **same origin** | Widget and API share scheme + host + port; avoids CORS on shared hosting. | 同一オリジン | "same domain" (acceptable in casual Japanese; English docs use **same origin**) |
| **citation** | Reference to a corpus **chunk** in an assistant message (`document_id`, `chunk_id`, optional page/section/excerpt). | 引用 / 出典 | "source link", "reference" (without corpus meaning) |
| **rate limit** | Request cap per session and/or IP before LLM calls. | レート制限 | "throttle" (internal only), "daily cap" (unless specifically daily) |

---

## Corpus domain

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **corpus** | The searchable body of ingested knowledge (documents split into chunks). | コーパス | "knowledge base" (marketing OK once; spec uses **corpus**) |
| **source** | Uploaded or registered origin of content (file path, upload batch, upstream ref). Table: `sources`. | ソース | "file" (when meaning source entity), "dataset" |
| **document** | Logical document derived from a source (PDF, CSV row set, etc.). Table: `documents`. | ドキュメント | "file", "record" |
| **chunk** | Searchable text segment indexed for retrieval and citation. Table: `chunks`. | チャンク | "paragraph", "embedding row" |
| **ingestion** | Upload, parse, chunk, and index pipeline. Module: `Ingestion/`. | 取り込み | "import", "ETL" (unless external systems) |
| **reindex** | Rebuild chunks/index for a source. | 再インデックス | "refresh", "resync" |

---

## Sessions and auth

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **chat session** | Consumer conversation container. Table: `chat_sessions`. | チャットセッション | "thread", "room" |
| **chat message** | Single user or assistant turn. Table: `chat_messages`. | チャットメッセージ | "utterance", "post" |
| **admin auth** | JWT Bearer for mutating admin routes. Module: `AdminAuth/`. | 管理認証 | "user login" (ambiguous with consumer) |
| **consumer session token** | Anonymous or lightweight token for embed widget; never admin JWT. | コンシューマーセッション | "API key" (consumer), "guest JWT" |

---

## LLM and integrations

| Canonical term | Definition | JavaScript note | Do not use |
| --- | --- | --- | --- |
| **LLM** | Large language model capability in prose/docs. | — | "AI" alone in specs |
| **Claude API** | Anthropic HTTP API used server-side (`ANTHROPIC_API_KEY`). | — | "OpenAI", "GPT" (wrong vendor) |
| **tool_use** | Claude server-side tool orchestration mapped to HTTP/search operations. Module folder: `Llm/`. | snake_case in API payloads if exposed | "function calling" in OpenAPI titles |
| **upstream** | Optional external HTTP content API (e.g. NeNe Records). Module: `Upstream/`. | — | "plugin", "CMS embed" |
| **MCP** | Model Context Protocol tools for **ops read-only** agents; maps to OpenAPI. Not for embed widget. | — | "consumer MCP", "chat MCP" |

---

## API and errors

| Canonical term | Definition | Do not use |
| --- | --- | --- |
| **Problem Details** | RFC 9457 error envelope (`application/problem+json`). | "error JSON", "exception response" |
| **operationId** | Stable camelCase identifier shared by OpenAPI, routes, and MCP. | "endpoint name", "route id" |
| **OpenAPI contract** | `docs/openapi/openapi.yaml` — public API source of truth. | "Swagger doc" in policy text |

---

## Architecture layers

| Canonical term | Definition | Do not use |
| --- | --- | --- |
| **handler** | HTTP adapter class (`*Handler`); thin. | "controller" in new NeNe Corpus code/docs |
| **use case** | Application operation (`*UseCase`, method `execute`). | "service" for use-case layer |
| **repository** | Persistence port (`*RepositoryInterface`, `Pdo*Repository`). | "DAO", "model" |

---

## Explicit non-goals (terminology)

| Term | Meaning |
| --- | --- |
| **WordPress plugin** | Not supported. Coexist on same origin only. |
| **Docker-only deployment** | Not a goal. Tier A must remain first-class. |

---

## Related

- ADR 0003: dual deployment and embed widget
- [`docs/deployment/README.md`](../deployment/README.md)
- [`docs/development/backend-standards.md`](../development/backend-standards.md)
