# Workflow

NeNe Corpus uses GitHub Issues for work tracking and local Markdown for project memory. This workflow inherits [NENE2 `docs/workflow.md`](https://github.com/hideyukiMORI/NENE2/blob/main/docs/workflow.md) with the substitutions below.

See also: `docs/inheritance-from-nene2.md`.

## Standard Flow

1. Create or reuse a focused GitHub Issue.
2. Confirm context in `docs/roadmap.md`, `docs/milestones/`, and private `nene-origin/internal-docs/corpus/todo/current.md`.
3. Create a branch from `main` named like `type/issue-number-summary`.
4. Implement the smallest useful change.
5. Update docs, roadmap, milestone, or TODO files when the decision or state changes.
6. Review the relevant self-review checklist in `docs/review/`.
7. Run the narrowest meaningful verification available.
8. Commit with [Conventional Commits](development/commit-conventions.md) and include the Issue number in the subject.
9. Push the branch and create a PR linked to the Issue.
10. Merge after review and checks pass.
11. Return local `main` to the merged, clean state.

**Do not commit directly to `main`.** Every merge to `main` goes through a PR tied to an Issue (except the documented bootstrap below).

## Branch Names

Use Conventional Commit style as the prefix:

- `docs/1-issue-driven-workflow-alignment`
- `feat/5-pdf-ingestion`
- `fix/12-rate-limit-bypass`
- `test/8-chat-citation-format`

## PR Requirements

Every PR should include:

- purpose
- change summary
- verification results
- self-review checklist used, when applicable (example: `Self-review: docs-policy`)
- related Issue — prefer `Closes #number` in the PR body
- remaining risks or follow-up work

## Local Project Memory

- `docs/roadmap.md`: long-lived direction and phases
- `docs/milestones/`: medium-sized goals and acceptance criteria
- private `nene-origin/internal-docs/corpus/todo/current.md`: current task board（運用ログは private へ移設）
- `docs/adr/`: major architecture decisions
- `docs/inheritance-from-nene2.md`: NENE2 governance inheritance map

Do not leave important decisions only in chat. If it changes how the project should be built, record it in `docs/`.

Use ADRs for decisions that affect architecture, public contracts, dependency choices, or long-term maintenance. See `docs/development/adr.md`.

Use self-review checklists before push or PR. See `docs/development/self-review.md`.

## AI Agent Responsibilities

When asked to complete work, AI agents should run the **full lifecycle** unless the user narrows scope (investigation only, no commit, no PR, etc.):

- create or reuse the Issue
- create the Issue branch from `main`
- read `AGENTS.md` and relevant docs before editing
- edit only relevant files
- review relevant self-review checklists in `docs/review/`
- verify the change (`composer check` when runtime code exists)
- commit with `(#issue)` in the subject
- push the branch and open a PR with checklist name and `Closes #number`
- merge after checks pass and sync local `main`
- update private `nene-origin/internal-docs/corpus/todo/current.md` and milestones when state changes

Direct pushes to `main` are **not** part of the normal agent workflow.

## Phase 0 bootstrap (historical exception)

The initial repository bootstrap (2026-05-24 — 2026-05-25) landed on `main` via direct commits **before** GitHub Issues existed. That was a one-time scaffold exception.

**From Phase 1 onward**, treat Issue → branch → PR → merge as mandatory. Do not repeat bootstrap-style direct commits.

## Language

- Public docs and OpenAPI: **English**
- Issues, PRs, commits, `.cursor/rules/`: **Japanese allowed**
