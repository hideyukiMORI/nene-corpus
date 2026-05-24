# ADR 0002: Separate Product from NeNe Records

## Status

accepted

## Context

NeNe Records is an API-first CMS on NENE2. NeNe Corpus is a knowledge chat OSS that may consume NeNe Records public APIs as one upstream data source. Early design notes in NeNe Records `docs/todo/current.md` stated that a consumer chat system must **not** be integrated into the CMS repository.

Alternatives considered:

1. **Embed chat in NeNe Records** — rejected; reverses dependency direction and mixes CMS and chat failure domains.
2. **Share one database** — rejected; couples schemas and bypasses API contracts.
3. **Independent product with HTTP client** (chosen): NeNe Corpus calls NeNe Records read APIs only.

## Decision

NeNe Corpus is a **separate repository and deployable unit**:

- Dependency direction: `NeNe Corpus → NeNe Records API` (and other upstreams). Never `NeNe Records → NeNe Corpus`.
- No shared PHP codebase beyond Composer dependency on NENE2.
- No chat routes, LLM adapters, or ingestion code in NeNe Records.
- NeNe Records provides documented read/search APIs; NeNe Corpus implements `Upstream/` HTTP clients.
- MCP protocol is **not** exposed to consumer chat UI. Server-side LLM uses tool_use mapped to HTTP operations.

```
Consumer Chat UI
    ↓
NeNe Corpus API (rate limit, sessions, audit)
    ↓
Claude API (tool_use — server only)
    ↓
NeNe Records read-only API (optional)
    ↓
CMS database (owned by NeNe Records)
```

Corpus-owned data (uploaded PDF/CSV, chunks, chat logs) lives in **NeNe Corpus database only**.

## Consequences

**Benefits**

- CMS remains stable when chat or LLM services fail.
- Chat can cache or degrade independently of CMS latency.
- Clear OSS story: two products, one framework.
- Security boundaries: CMS admin JWT ≠ consumer chat session.

**Costs**

- Two repos to maintain; cross-repo API contract must stay documented.
- Some duplication of admin UI patterns (acceptable; different domains).

**Follow-up**

- Document upstream client env vars in `docs/integrations/nene-records-client.md`.
- Add contract tests when NeNe Records search API (M3) is available.

## Related

- Product vision: `docs/explanation/product-vision.md`
- Upstream client policy: `docs/integrations/nene-records-client.md`
- NeNe Records chat design note: https://github.com/hideyukiMORI/nene-records/blob/main/docs/todo/current.md
