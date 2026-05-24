# Docker Development

Local stack for NeNe Corpus backend development.

## Services

| Service | Purpose | Default port |
| --- | --- | --- |
| `app` | PHP 8.4 Apache + NeNe Corpus | 8080 |
| `mysql` | Optional MySQL 8.4 | 3307 |

SQLite is the default for host-side PHPUnit. Docker Compose uses MySQL for parity with production-like setups.

## Quick Start

```bash
cp .env.example .env
docker compose up --build -d
curl -fsS http://localhost:8080/health
```

OpenAPI YAML: `http://localhost:8080/openapi.php`

## Environment

Copy `.env.example` to `.env`. Key variables:

| Variable | Purpose |
| --- | --- |
| `APP_NAME` | Application name |
| `PROBLEM_DETAILS_BASE_URL` | Problem Details type prefix |
| `DB_*` | Database connection |
| `NENE_CORPUS_PORT` | Host port for app |
| `ANTHROPIC_API_KEY` | Claude API (Phase 2+) — never commit |
| `NENE_RECORDS_API_BASE_URL` | Optional upstream CMS |

## Path dependency (local dev)

`composer.json` may use a path repository to `../NENE2` for framework development. CI clones NENE2 alongside the project instead.

## Commands

```bash
docker compose exec app composer check
docker compose exec app composer migrations:migrate
docker compose exec app composer test
```

## Skip migrations

For empty migration sets or debugging:

```bash
NENE_CORPUS_SKIP_MIGRATE=1 docker compose up --build -d
```

## Volumes

- Project root mounted at `/var/www/html`
- `../NENE2` mounted read-only for path Composer dependency
- Shared Composer cache volume
