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
| Naming / glossary | `docs/development/naming-conventions.md`, `docs/explanation/glossary.md` |
| Deployment / dual Tier A·B | `docs/deployment/README.md`, ADR 0003 |
| Current tasks | `docs/todo/current.md` |
| Roadmap | `docs/roadmap.md` |

## Quick Rules

- **Issue-driven**: no Issue, no code/doc/config change (except explicit user scope limits).
- **Branch**: `type/issue-number-summary` from `main`; **never** commit or push directly to `main`.
- **Commits**: Conventional Commits; type/scope English, description/body Japanese; subject includes `(#issue)`.
- **PR → merge**: push branch, open PR with `Closes #n` and checklist name, merge after CI green, sync local `main`.
- **Phase 0 note**: bootstrap commits predated Issues; **Phase 1+ must follow full workflow** (`docs/workflow.md`).
- **Secrets**: never commit `.env`, tokens, API keys (`ANTHROPIC_API_KEY`, upstream JWTs), or credentials.
- **Separation**: do not embed chat logic in NeNe Records; consume upstream via HTTP client only (ADR 0002).
- **Framework**: NENE2 via Composer — read `vendor/hideyukimori/nene2/docs/` for runtime patterns.
- **MCP**: tools go through OpenAPI HTTP boundary only; never expose MCP to consumer chat UI.

## Product Direction

Self-hosted knowledge corpus — ingest documents, chat with citations, keep data on your stack. **Dual deployment:** **Tier A** shared hosting or **Tier B** Docker/VPS. Same-origin **embed widget**; **sync JSON chat** default. Admin UI + consumer chat. Optional NeNe Records upstream. ADR 0003; terms in `docs/explanation/glossary.md`.

## Verification

```bash
composer check                    # PHPUnit + PHPStan + CS-Fixer + OpenAPI + MCP
docker compose up --build -d      # local stack
curl -fsS http://localhost:8080/health
```
