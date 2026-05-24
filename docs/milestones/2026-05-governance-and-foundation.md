# Milestone: Governance and Foundation (2026-05)

Goal: establish NeNe Corpus engineering discipline inherited from NENE2 before product features grow.

**Status: complete (2026-05-25)**

> **Workflow note:** Phase 0 landed via direct `main` commits before Issues existed (bootstrap exception). Phase 1+ must use Issue → branch → PR → merge. See `docs/workflow.md`.

## Acceptance Criteria

- [x] GitHub repository created (`hideyukiMORI/nene-corpus`)
- [x] `docs/inheritance-from-nene2.md` documents local vs upstream rules
- [x] `docs/workflow.md` and commit conventions in place
- [x] `AGENTS.md`, `CLAUDE.md`, `docs/CONTRIBUTING.md` exist
- [x] `.cursor/rules/` summaries for always-on agent guidance
- [x] `docs/review/` initial self-review checklists
- [x] ADR 0001 and ADR 0002 accepted
- [x] `docs/roadmap.md`, `docs/explanation/product-vision.md`, and `docs/todo/current.md` initialized
- [x] `composer check` green on `main` (health endpoint + OpenAPI + MCP)
- [x] Backend CI workflow passing on GitHub ([run 26368111210](https://github.com/hideyukiMORI/nene-corpus/actions/runs/26368111210))

## Follow-up Milestone

Phase 1 — Corpus storage and ingestion API.
