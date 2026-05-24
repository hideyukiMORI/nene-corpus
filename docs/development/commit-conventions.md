# Commit Message Conventions

NeNe Corpus uses Conventional Commits, inherited from [NENE2](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/commit-conventions.md).

## Format

```text
<type>(<optional scope>): <description> (#<issue>)

[optional body]

[optional footer]
```

## Language

- Keep `type`, `scope`, `BREAKING CHANGE`, and other Conventional Commits keywords in **English**.
- Write the **description and body in Japanese**.
- Include the related GitHub Issue number in the **subject** for all work after Phase 0 bootstrap.

Example:

```text
docs(governance): Issue 駆動ワークフローを NENE2 正本に整合する (#1)
```

```text
feat(ingestion): sources テーブルの migration を追加する (#5)
```

## Issue number

| Situation | Rule |
| --- | --- |
| Normal work (Phase 1+) | Subject **must** include `(#issue)` |
| Phase 0 bootstrap commits (historical) | Predate Issues — do not retroactively rewrite unless doing a dedicated history cleanup Issue |
| Docs-only follow-up on same Issue | Reuse the same Issue number |

If you start editing without an Issue, **stop and create one first** — see `docs/workflow.md`.

## Common Types

| Type | Use |
| --- | --- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change without feature or bug fix |
| `test` | Test additions or changes |
| `build` | Dependency or build setup |
| `ci` | CI configuration |
| `chore` | Maintenance |

## Body

Use the body when the reason is not obvious from the subject. Explain why the change exists, what trade-off was chosen, and whether follow-up work remains.

## Breaking Changes

Use `!` or a `BREAKING CHANGE:` footer when public API, configuration, CLI, or documented behavior changes incompatibly.

Public API changes must also update OpenAPI and, when applicable, `docs/mcp/tools.json`.
