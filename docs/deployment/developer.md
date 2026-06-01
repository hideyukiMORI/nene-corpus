# Developer Deployment (Tier B)

Guide for engineers deploying NeNe Corpus alongside an existing system — VPS, Docker, or git clone on a PHP host.

For Japan SMB **shared hosting** (ZIP + web installer), see [`shared-hosting.md`](./shared-hosting.md).

## Quick start (Docker)

```bash
git clone https://github.com/hideyukiMORI/nene-corpus.git
cd nene-corpus
cp .env.example .env
docker compose up --build -d
curl -fsS http://localhost:8989/health
```

Full details: [`../development/docker.md`](../development/docker.md)

## Git clone layout

Clone into your document root or any working directory:

```text
/var/www/example.com/nene-corpus/   ← repository root
├── public_html/                    ← web document root for this app
├── src/
├── vendor/
└── .env
```

Point the web server at `public_html/`, or mount it as a subdirectory (for example `/nene-corpus/`).

## Public base path detection

When NeNe Corpus lives in a subdirectory, PHP detects the public base path from `SCRIPT_NAME` (for example `/nene-corpus/index.php` → base path `/nene-corpus`).

The web installer writes `NENE_CORPUS_BASE_PATH` into `.env`. The API strips that prefix before routing, and `GET /install/status` returns embed paths:

- `widget_script_src` — `/nene-corpus/widget.js`
- `api_base` — `/nene-corpus` (use as `data-endpoint`)

## First-time setup in browser

Open:

```text
https://example.com/nene-corpus/install/
```

The installer:

1. Tests the database connection
2. Writes `.env`
3. Runs migrations
4. Creates the first admin user
5. Locks itself (`var/installed.lock`)

## Embed on another site (same origin)

After install, add the widget on any page served from the **same origin**:

```html
<script src="/nene-corpus/widget.js" data-endpoint="/nene-corpus" defer></script>
```

Replace `/nene-corpus` with the value from `GET /install/status` → `paths.api_base`. The widget auto-starts — copy the snippet from **Admin → Appearance** for your base path.

## Integrating from another backend

NeNe Corpus is a **separate service**, not a Composer library inside your app.

Recommended patterns:

| Pattern | When |
| --- | --- |
| **Sidecar / subdirectory** | Same VPS — nginx routes `/nene-corpus/` to this app |
| **embed widget** | Existing web UI — one script tag on same-origin pages |
| **OpenAPI HTTP client** | Custom admin/mobile UI — call `/chat/*` and `/admin/*` from your backend |

Do **not** embed Corpus PHP code into another monolith. Keep the HTTP boundary (ADR 0002).

## Related

- [`README.md`](../../README.md)
- [`shared-hosting.md`](./shared-hosting.md)
- ADR 0003 — dual deployment
