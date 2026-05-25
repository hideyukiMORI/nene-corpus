# Shared Hosting Deployment (Tier A)

Operator guide for **Tier A** **shared hosting** — the primary deployment target for Japan SMB. See ADR 0003 and [`glossary.md`](../explanation/glossary.md).

> **Status:** This path is the **product target** for operators. The **web installer** and **release ZIP** ship in **Phase 3**. Until then, advanced operators can deploy manually using the requirements below; Docker remains the supported development path (Tier B).

## Who this is for

- Companies with an existing homepage on rental hosting (さくura, エックスサーバー, ロリポップ, ConoHa WING, etc.)
- Operators who want **WordPress-like adoption** — upload, run installer, use admin UI — without replacing their current site
- Teams that need corpus and chat data on **their MySQL**, not a SaaS vendor

NeNe Corpus is **not a WordPress plugin**. It installs as a separate PHP app on the **same origin** and embeds **embed widget** into existing pages via one script tag.

## Requirements

| Requirement | Notes |
| --- | --- |
| PHP | 8.2+ planned for Tier A (8.4 for development); confirm with host |
| Database | MySQL 8.x or MariaDB 10.x (SQLite possible for very small installs — not recommended for production chat) |
| Web server | Apache with `mod_rewrite` or nginx equivalent; document root includes `public_html/` |
| HTTPS | Recommended for admin JWT and widget sessions |
| Outbound HTTPS | Required from Phase 2 (Claude API) — confirm host allows external API calls |
| Writable dirs | `storage/uploads/`, `var/` or configured cache paths |
| Cron | Optional but recommended for reindex and cleanup (Phase 1+) |

## Planned install flow (Phase 3)

1. Download **release ZIP** (includes `vendor/` — no Composer required on server).
2. Upload via FTP or hosting file manager to e.g. `/nene-corpus/` under the domain.
3. Open **web installer** in browser — database credentials, admin account, optional API keys.
4. Run migrations from installer (no SSH required).
5. Copy the **embed widget** snippet from admin UI into existing homepage template.

## Embed on existing homepage

**Same origin** — add one line to any page:

```html
<script
  src="https://example.com/nene-corpus/widget.js"
  data-endpoint="/nene-corpus/api"
  defer
></script>
```

Works alongside WordPress, static HTML, or other CMS pages on the **same origin**. The **embed widget** calls **sync JSON chat** (loading indicator while waiting; **SSE streaming** not required on Tier A).

## Manual deploy (until web installer exists)

For early adopters with SSH or FTP + local build:

1. Run `composer install --no-dev` locally and create a ZIP of the project (including `vendor/`).
2. Upload to hosting; point a subdomain or subdirectory to `public_html/`.
3. Copy `.env.example` to `.env` and set `DB_*` for MySQL.
4. Run `composer migrations:migrate` via SSH, or use a one-time migration script (to be provided in Phase 3).
5. Ensure `storage/` is writable and not web-accessible.

See [Docker development](../development/docker.md) for the canonical runtime layout.

## Limitations on shared hosting

- **PDF ingestion** may hit execution time and upload size limits — split large files or use Tier B for heavy **ingestion**.
- **SSE streaming** is not planned as Tier A default; use **sync JSON chat**.
- **Claude API** usage is pay-as-you-go — configure keys in admin UI (Phase 2+).

## Troubleshooting

Document host-specific fixes in Issues/PRs as they appear. Common checks:

- `public_html/index.php` reachable; rewrite rules pass requests to front controller
- MySQL user has CREATE/ALTER during install only
- `storage/` permissions (typically `755` or `775` depending on host)

## Related

- ADR 0003: `docs/adr/0003-dual-deployment-and-embed-widget.md`
- Docker / VPS (Tier B): `docs/development/docker.md`
- Product vision: `docs/explanation/product-vision.md`
- Glossary: `docs/explanation/glossary.md`
