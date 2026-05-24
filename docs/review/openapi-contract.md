# OpenAPI Contract Self-Review

Use when changing `docs/openapi/openapi.yaml` or API response shapes. Policy source: **`docs/development/backend-standards.md`**.

Also read:

- NENE2: `docs/integrations/openapi.md`, `docs/development/endpoint-scaffold.md`

## Contract completeness

- [ ] Every shipped JSON endpoint has an OpenAPI path with stable `operationId`.
- [ ] Summary, description, request body, query params match handler format validation.
- [ ] Success response has schema and realistic `ok` example.
- [ ] Problem Details responses documented (`401`, `404`, `422`, `500`, … as applicable).
- [ ] Public OpenAPI text is English.

## Runtime alignment

- [ ] Handler response shapes match OpenAPI success schema.
- [ ] Request DTO rules align with documented required fields and formats.
- [ ] `composer openapi` passes.
- [ ] Contract tests in `tests/OpenApi/` updated when public examples change.

## MCP (when applicable)

- [ ] `docs/mcp/tools.json` entries reference valid OpenAPI `method`, `path`, `operationId`.
- [ ] `composer mcp` passes when catalog changed.

## Endpoint completion

- [ ] Route + handler + use case + repository (if persistent) land together or same PR series.
- [ ] Migration + schema snapshot included when new tables introduced.

## PR

- [ ] PR notes mention `Self-review: openapi-contract` when contract-facing.
- [ ] No merge with OpenAPI drift from runtime behavior.
