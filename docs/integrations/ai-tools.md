# AI Tools Policy

NeNe Corpus inherits NENE2 AI integration principles with chat-specific boundaries.

## Agent entry

- `AGENTS.md` — read first
- `CLAUDE.md` — quick rules
- `.cursor/rules/` — Cursor summaries

## MCP boundary

- MCP tools map to **OpenAPI HTTP operations** only.
- MCP is for **operators and development agents**, not consumer chat UI.
- Do not add tools that read the database directly or execute shell commands without Issue + security review.

Validate catalog:

```bash
composer mcp
```

## LLM boundary (Phase 2+)

- Claude API calls happen in `Llm/` infrastructure adapters.
- UseCases define *what* to retrieve; adapters define *how* to call the model.
- Tool definitions for the model mirror documented HTTP/search operations — not raw SQL.
- Never pass admin JWT or `ANTHROPIC_API_KEY` to client-side code.

## Prompt injection

- User chat input is untrusted.
- System prompts must enforce corpus scope and citation requirements.
- Log redaction: no full API keys, no upstream bearer tokens, no uploaded file binary in logs.

## Secrets in agent sessions

Agents must not commit:

- `.env` files
- `ANTHROPIC_API_KEY`
- Production upstream URLs with embedded credentials

## Cross-repo work

- CMS bugs or missing APIs → Issue in **nene-records**, not workarounds here.
- Framework bugs → Issue in **NENE2**.

See also: `docs/integrations/nene-records-client.md`, ADR 0002.
