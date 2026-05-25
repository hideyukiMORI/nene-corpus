# Milestone: Chat & Citations (2026-05)

Goal: grounded consumer Q&A with cited responses via **sync JSON chat**.

**Status: in progress**

Tracked by [`docs/roadmap.md`](../roadmap.md) Phase 2.

## Acceptance Criteria

- [x] Phinx migration for `chat_sessions`, `chat_messages` (#17)
- [x] Schema snapshots in `database/schema/`
- [x] Domain entities + `Pdo*Repository` adapters + service providers
- [x] Repository tests (SQLite `:memory:`)
- [x] Full-text chunk search (#19)
- [x] Claude tool_use orchestration (server-side) (#25)
- [x] **sync JSON chat** endpoint + OpenAPI (#25)
- [x] **Citation** payload in responses (#25)
- [ ] Rate limiting (session / IP)

## Verification

```bash
composer migrations:migrate
composer check
```

## Related

- Issue #17 — chat session/message schema
- Issue #19 — chunk full-text search
- Issue #25 — sync JSON chat + Claude tool_use
- [`docs/explanation/glossary.md`](../explanation/glossary.md) — sync JSON chat, citation, consumer session token
- ADR 0003 — sync JSON chat as Tier A/B default
