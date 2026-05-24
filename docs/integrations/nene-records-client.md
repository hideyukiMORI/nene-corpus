# NeNe Records Client Boundary

NeNe Corpus may consume [NeNe Records](https://github.com/hideyukiMORI/nene-records) as an **optional upstream** for structured public content. This document defines the integration boundary.

## Policy (ADR 0002)

- NeNe Corpus is a **separate product** — not a module inside NeNe Records.
- Dependency direction: `NeNe Corpus → NeNe Records HTTP API` only.
- Read-only client for Phase 4; no writes to CMS data from chat code paths unless a future ADR explicitly allows it.
- No shared database connection strings.

## Implementation

Code lives under `src/Upstream/`:

```
Upstream/
  NeneRecordsClientInterface.php
  HttpNeneRecordsClient.php
```

UseCases depend on the interface, not Guzzle/curl directly.

## Configuration (planned)

| Env var | Purpose |
| --- | --- |
| `NENE_RECORDS_API_BASE_URL` | Base URL, e.g. `http://localhost:8080` |
| `NENE_RECORDS_BEARER_TOKEN` | Optional machine/read token |

Document in `.env.example` with empty values only.

## LLM access pattern

Consumer chat does **not** call NeNe Records directly. Flow:

```
User → NeNe Corpus Chat API → Claude (tool_use) → NeNe Corpus tool handler → NeneRecordsClient → NeNe Records API
```

MCP is not exposed to the user browser.

## When upstream is unavailable

- Chat should degrade gracefully: answer from local corpus only, or return a clear unavailable message.
- Do not cache CMS credentials in client-side widget code.

## Related

- ADR 0002: `docs/adr/0002-separate-from-nene-records.md`
- NeNe Records OpenAPI: https://github.com/hideyukiMORI/nene-records/blob/main/docs/openapi/openapi.yaml
