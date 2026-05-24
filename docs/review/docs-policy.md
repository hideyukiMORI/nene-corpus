# Documentation and Policy Self-Review

Use for policy docs, workflow docs, ADRs, roadmap updates, TODO updates, and Cursor rules.

Source policies:

- `docs/workflow.md`
- `docs/development/adr.md`
- `docs/inheritance-from-nene2.md`
- `docs/todo/current.md`
- `docs/roadmap.md`

## Checklist

- [ ] The source-of-truth policy doc was updated instead of only adding a summary elsewhere.
- [ ] `docs/roadmap.md` or `docs/todo/current.md` updated when project state changed.
- [ ] Major architecture decisions considered whether an ADR is needed.
- [ ] NENE2 inheritance changes reflected in `docs/inheritance-from-nene2.md`.
- [ ] Public source-of-truth docs and OpenAPI text remain English unless policy allows otherwise.
- [ ] Cursor rules stay concise; full policy not duplicated in `.cursor/rules/`.
- [ ] Issue and PR references included where useful.
- [ ] Wording is concrete enough for humans and AI agents to follow.
- [ ] `git diff --check` reviewed for whitespace errors.
