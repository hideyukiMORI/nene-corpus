# Milestone: Chat & Citations (2026-05)

Goal: grounded consumer Q&A with cited responses via **sync JSON chat**.

**Status: in progress**

Tracked by [`docs/roadmap.md`](../roadmap.md) Phase 2.

## Acceptance Criteria

- [x] Phinx migration for `chat_sessions`, `chat_messages` (#17)
- [x] Schema snapshots in `database/schema/`
- [x] Domain entities + `Pdo*Repository` adapters + service providers
- [x] Repository tests (SQLite `:memory:`)
- [ ] Full-text chunk search (#19)
- [ ] Claude tool_use orchestration (server-side)
- [ ] **sync JSON chat** endpoint + OpenAPI
- [ ] **Citation** payload in responses
- [ ] Rate limiting (session / IP)

## Verification

```bash
composer migrations:migrate
composer check
```

## Related

- Issue #17 — chat session/message schema
- Issue #19 — chunk full-text search
- [`docs/explanation/glossary.md`](../explanation/glossary.md) — sync JSON chat, citation, consumer session token
- ADR 0003 — sync JSON chat as Tier A/B default
