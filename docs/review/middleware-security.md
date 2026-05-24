# Middleware and Security Self-Review

Use for auth, CORS, logging, rate limits, and request pipeline changes.

Source policies:

- `docs/inheritance-from-nene2.md`
- NENE2: `docs/development/middleware-security.md`, `authentication-boundary.md`, `observability.md`

## Checklist

- [ ] Middleware order matches NENE2 documented baseline unless ADR documents a deviation.
- [ ] Auth failures return documented Problem Details, not ad-hoc JSON.
- [ ] Logs do not include tokens, passwords, Authorization headers, or raw bodies.
- [ ] CORS allowlist is config-driven; production origins are explicit.
- [ ] Machine client paths use API key or documented auth mechanism.
- [ ] Write MCP tools require authentication when JWT/API key is configured.
- [ ] PR notes mention this checklist when security-facing.
