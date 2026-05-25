# Milestone: Corpus Storage & Ingestion (2026-05)

Goal: store **sources**, **documents**, and **chunks** — the canonical ingestion model for Phase 1.

**Status: in progress**

Tracked by [`docs/roadmap.md`](../roadmap.md) Phase 1.

## Acceptance Criteria

- [x] Phinx migration for `sources`, `documents`, `chunks` (#7)
- [x] Schema snapshots in `database/schema/`
- [x] Domain entities + `Pdo*Repository` adapters + service providers
- [x] Repository tests (SQLite `:memory:`)
- [x] Admin auth (JWT) for mutating routes (#9)
- [x] CSV upload API + column mapping preview (#11)
- [x] PDF text extraction (text PDF first) (#13)
- [ ] Admin HTTP routes + OpenAPI
- [ ] Reindex / delete **source** operations API

## Verification

```bash
composer migrations:migrate
composer check
```

## Related

- Issue #7 — schema foundation
- [`docs/explanation/glossary.md`](../explanation/glossary.md) — corpus domain terms
