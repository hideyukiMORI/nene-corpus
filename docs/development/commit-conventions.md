# Commit Message Conventions

NeNe Records uses Conventional Commits, inherited from [NENE2](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/commit-conventions.md).

## Format

```text
<type>(<optional scope>): <description> (#<issue>)

[optional body]

[optional footer]
```

## Language

- Keep `type`, `scope`, `BREAKING CHANGE`, and other Conventional Commits keywords in **English**.
- Write the **description and body in Japanese**.
- Include the related GitHub Issue number in the subject when practical.

Example:

```text
docs(governance): NENE2 系ワークフロー規約を継承する (#2)
```

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
