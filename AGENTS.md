# Agent / AI Guide

This file is the entry point for AI agents working on NeNe Corpus.

## Read First

- **Current work & status:** private `nene-origin/internal-docs/corpus/todo/current.md` (operational logs moved to the private mirror — P3, 2026-07-18; public docs stay Diátaxis + ADR/CHANGELOG only)
- **Product vision:** `docs/explanation/product-vision.md`
- **Glossary:** `docs/explanation/glossary.md`
- **Naming conventions:** `docs/development/naming-conventions.md`
- **Deployment (dual Tier A/B):** `docs/deployment/README.md`, ADR 0003
- Inheritance map: `docs/inheritance-from-nene2.md`
- Human and AI collaboration: `docs/CONTRIBUTING.md`
- Workflow: `docs/workflow.md`
- Coding standards: `docs/development/coding-standards.md`
- Backend standards: `docs/development/backend-standards.md`
- Commit messages: `docs/development/commit-conventions.md`
- AI tool policy: `docs/integrations/ai-tools.md`
- NeNe Records boundary: `docs/integrations/nene-records-client.md`
- Roadmap: `docs/roadmap.md`
- Milestones: `docs/milestones/2026-05-governance-and-foundation.md`

## Operating Rules

- **Issue-driven**: no substantive code, doc, or config change without a GitHub Issue. Create one first.
- **No direct commits to `main`**. Branch `type/issue-number-summary` → PR → merge after checks.
- **Commits**: Conventional Commits; type/scope English, description/body Japanese, `(#issue)` in subject.
- **Full lifecycle** (unless user limits scope): Issue → branch → implement → verify → commit → push → PR → merge → sync `main`.
- Read NENE2 upstream docs for framework behavior; read local docs for product rules.
- **Never integrate this chat system into NeNe Records.** Dependency direction is `NeNe Corpus → upstream APIs`, never the reverse. See ADR 0002.
- Keep private `nene-origin/internal-docs/corpus/todo/current.md` and milestones aligned with Issues and PRs.
- Keep changes focused. Do not mix governance, feature work, and unrelated cleanup in one PR.
- Do not commit secrets, credentials, local `.env` files, or generated build outputs.
- Prefer explicit, typed, testable code over hidden framework behavior.
- When docs and Cursor rules conflict, update the docs first and keep `.cursor/rules/` concise.

## Project Direction

NeNe Corpus is a self-hosted knowledge chat OSS on NENE2:

- **Primary operators:** Japan SMB on PHP shared hosting (Tier A); **also** Docker/VPS (Tier B). Same codebase — ADR 0003.
- Ingest PDF, CSV, and structured sources into a searchable corpus.
- Answer end-user questions with **cited** responses via **sync JSON chat** (widget CSS for loading/motion; **SSE streaming** is a non-goal).
- Embed **embed widget** on existing homepages with one same-origin `<script>` (Phase 3).
- Admin UI for ingestion, corpus management, conversation logs, and settings.
- OpenAPI as the contract; MCP for ops/read-only agent tooling only.
- **Not** a CMS or WordPress plugin — sibling to [NeNe Records](https://github.com/hideyukiMORI/nene-records), not a module inside it.

## Framework Reference

Install `hideyukimori/nene2` via Composer. For HTTP runtime, middleware, Problem Details, and MCP patterns, NENE2 upstream documentation is authoritative unless a local ADR says otherwise.
