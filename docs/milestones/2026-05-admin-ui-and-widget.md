# Milestone: Admin UI & Widget (2026-05)

Goal: operable product without curl — React admin, **embed widget**, Tier A install path.

**Status: complete (2026-05-25)**

Tracked by [`docs/roadmap.md`](../roadmap.md) Phase 3.

## Acceptance Criteria

- [x] `frontend/` monorepo scaffold (#33)
- [x] `docs/development/frontend-standards.md` (#33)
- [x] Admin sources list UI (#39)
- [x] Admin CSV/PDF upload UI (#45)
- [x] **embed widget** wired to **sync JSON chat** (#37)
- [x] conversation logs
- [x] Appearance settings (operator theme overrides)
- [x] **web installer** (#101)
- [x] **release ZIP** (#103)
- [x] Shared-hosting operator docs (#105)

## Phase 3+ backlog (agreed, not started)

See [`docs/todo/current.md`](../todo/current.md) — operator docs, text paste ingestion, document CRUD, widget chat UX (bubbles, HERO, custom CSS).

## Verification

```bash
npm run check --prefix frontend
npm run build --prefix frontend
composer check
composer release:zip
```

## Related

- Issue #33 — frontend scaffold
- Issue #37 — embed widget sync JSON chat
- Issue #39 — admin sources list API + UI
- Issue #45 — admin CSV/PDF upload UI
- Issue #101 — web installer
- Issue #103 — release ZIP
- Issue #105 — shared-hosting operator docs
- [`docs/deployment/shared-hosting.md`](../deployment/shared-hosting.md)
- [`docs/development/frontend-standards.md`](../development/frontend-standards.md)
- ADR 0003 — dual deployment and embed widget
