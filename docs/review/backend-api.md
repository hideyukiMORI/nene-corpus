# Self-Review: Backend API

Use when changing handlers, use cases, routes, or OpenAPI paths under `src/`.

## Contract

- [ ] Route registered and matches `docs/openapi/openapi.yaml` `operationId`
- [ ] Success response schema documented with example
- [ ] Problem Details responses for expected failures (404, 422, 401, 429)
- [ ] `composer openapi` passes

## Layering

- [ ] Handler only parses input, calls UseCase, returns response
- [ ] UseCase has no HTTP/PDO/LLM client imports
- [ ] Repository interface in domain; PDO in adapter

## Chat-specific (when applicable)

- [ ] Assistant responses include citation structure (document/chunk refs)
- [ ] Rate limit checked before LLM call
- [ ] User message not logged with secrets
- [ ] Scope fallback when corpus has no match

## Security

- [ ] Admin mutating routes require auth (when implemented)
- [ ] Upload size/type validated
- [ ] No SQL string concatenation with user input

## Tests

- [ ] UseCase unit test with in-memory repo, or HTTP test for new endpoint
- [ ] `composer check` passes locally
