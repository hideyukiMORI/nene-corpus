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

## Path dependency (NENE2)

`composer.json` declares a **path repository** only — there is no Packagist fallback for `hideyukimori/nene2` in this scaffold:

```json
"repositories": [{ "type": "path", "url": "../NENE2" }],
"require": { "hideyukimori/nene2": "@dev" }
```

Composer resolves `../NENE2` relative to this project root. NENE2 must exist as a **sibling directory**.

### Local workspace layout

```text
…/docker/                    (or your parent folder)
├── NENE2/                   ← framework checkout
└── nene-corpus/             ← this repository
```

Docker Compose also bind-mounts `../NENE2` read-only into the app container (see `compose.yaml`).

### GitHub Actions CI

CI does **not** use Packagist for NENE2 during Phase 0. The workflow checks out this repo, then clones NENE2 to the sibling path Composer expects:

```text
/home/runner/work/nene-corpus/
├── nene-corpus/             ← actions/checkout (working directory)
└── NENE2/                   ← git clone … ../NENE2
```

See `.github/workflows/backend-ci.yml` — step **Clone NENE2 (local path dependency)** must run **before** `composer install`.

If `composer install` fails with “path repository … does not exist”, verify NENE2 is at `../NENE2` relative to the project root.

### Production / Packagist (later)

When releases should not depend on a sibling checkout, switch `require` to `hideyukimori/nene2:^1.5` and remove or gate the path `repositories` entry in a dedicated Issue — same pattern as other NENE2 consumer apps.

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
