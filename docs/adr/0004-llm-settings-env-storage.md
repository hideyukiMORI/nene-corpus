# ADR 0004: LLM Settings Storage via `.env`

## Status

accepted

## Context

Operators need to rotate `ANTHROPIC_API_KEY` and adjust `ANTHROPIC_MODEL` from Admin without SSH/FTP. Tier A (shared hosting) and Tier B (Docker) both already load LLM config from environment variables via `AnthropicConfig::fromEnvironment()`. The web installer writes secrets to `.env` using `EnvFileWriter`.

Alternatives considered:

1. **Encrypted DB column** — adds key-management complexity, backup/restore semantics, and migration surface; duplicates the install-time secret path.
2. **`.env` partial update** (chosen) — reuses `EnvFileWriter`, matches installer behaviour, works on Tier A when the PHP process can write the project root (same requirement as install).

## Decision

- Admin `GET/PUT /admin/settings/llm` reads and updates `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and `ANTHROPIC_MAX_TOKENS` in `.env`.
- `GET` returns **masked** key only (`sk-ant-…xxxx`); never the full secret.
- `PUT` accepts an optional `api_key`; omit or empty means **keep existing**.
- `POST /admin/settings/llm/test` validates connectivity with a lightweight Messages API call (optional `api_key` in body for pre-save test).
- After a successful write, update runtime `$_ENV` / `putenv` for the current request; subsequent requests reload via existing bootstrap.
- Document backup and file-permission requirements in `shared-hosting.md`.

## Consequences

- `.env` must remain writable by the web user on Tier A (same as install).
- Docker operators should persist `.env` on the host volume; compose already passes `ANTHROPIC_API_KEY`.
- Multi-node deployments are out of scope (self-hosted single instance).

## References

- Issue #130
- `src/Llm/AnthropicConfig.php`, `src/Install/EnvFileWriter.php`
