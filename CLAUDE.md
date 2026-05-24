# CLAUDE.md — NeNe Corpus

Claude Code / AI agent guide for this repository. Cursor summaries live in `.cursor/rules/`.

## Source of Truth

| Purpose | Document |
| --- | --- |
| NENE2 inheritance | `docs/inheritance-from-nene2.md` |
| NeNe Records boundary | `docs/integrations/nene-records-client.md` |
| Agent entry | `AGENTS.md` |
| Workflow | `docs/workflow.md` |
| Commits | `docs/development/commit-conventions.md` |
| Coding | `docs/development/coding-standards.md` |
| Current tasks | `docs/todo/current.md` |
| Roadmap | `docs/roadmap.md` |

## Quick Rules

- **Issue-driven**: no Issue, no code/doc change (except explicit user scope limits).
- **Branch**: `type/issue-number-summary` from `main`; never commit directly to `main`.
- **Commits**: Conventional Commits; type/scope English, description/body Japanese, include `(#issue)`.
- **PR**: purpose, changes, verification, checklist name, `Closes #n`.
- **Secrets**: never commit `.env`, tokens, API keys (`ANTHROPIC_API_KEY`, upstream JWTs), or credentials.
- **Separation**: do not embed chat logic in NeNe Records; consume upstream via HTTP client only (ADR 0002).
- **Framework**: NENE2 via Composer — read `vendor/hideyukimori/nene2/docs/` for runtime patterns.
- **MCP**: tools go through OpenAPI HTTP boundary only; never expose MCP to consumer chat UI.

## Product Direction

Self-hosted knowledge corpus — ingest documents, chat with citations, keep data on your stack. Admin UI + consumer chat widget. Optional NeNe Records as one upstream data source.

## Verification

```bash
composer check                    # PHPUnit + PHPStan + CS-Fixer + OpenAPI + MCP
docker compose up --build -d      # local stack
curl -fsS http://localhost:8080/health
```
