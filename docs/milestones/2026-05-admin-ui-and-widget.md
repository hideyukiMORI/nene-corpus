# Milestone: Admin UI & Widget (2026-05)

Goal: operable product without curl — React admin, **embed widget**, Tier A install path.

**Status: in progress**

Tracked by [`docs/roadmap.md`](../roadmap.md) Phase 3.

## Acceptance Criteria

- [x] `frontend/` monorepo scaffold (#33)
- [x] `docs/development/frontend-standards.md` (#33)
- [ ] Admin: sources, ingestion status, conversation logs
- [x] **embed widget** wired to **sync JSON chat** (#37)
- [ ] Appearance settings (operator theme overrides)
- [ ] **web installer** + **release ZIP** (Tier A)
- [ ] Shared-hosting operator docs update

## Verification

```bash
npm run check --prefix frontend
npm run build --prefix frontend
composer check
```

## Related

- Issue #33 — frontend scaffold
- Issue #37 — embed widget sync JSON chat
- [`docs/development/frontend-standards.md`](../development/frontend-standards.md)
- ADR 0003 — dual deployment and embed widget
