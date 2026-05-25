# Shared Hosting Deployment (Tier A)

Operator guide for **Tier A** **shared hosting** — the primary deployment target for Japan SMB. See ADR 0003 and [`glossary.md`](../explanation/glossary.md).

NeNe Corpus is **not a WordPress plugin**. It installs as a separate PHP app on the **same origin** as your existing homepage and adds a cited **embed widget** via a short HTML snippet.

Engineers on VPS or Docker should use [`developer.md`](./developer.md) or [`../development/docker.md`](../development/docker.md) instead.

---

## Who this is for

- Companies with an existing homepage on rental hosting (さくura, エックスサーバー, ロリポップ, ConoHa WING, etc.)
- Operators who want **WordPress-like adoption** — upload, run installer, manage from admin UI
- Teams that need corpus and chat data on **their MySQL**, not a SaaS vendor

---

## Requirements

| Requirement | Notes |
| --- | --- |
| PHP | **8.4+** (matches release ZIP; confirm with your host) |
| Extensions | `pdo`, `pdo_mysql` (or `pdo_sqlite` for tiny test installs), `json`, `mbstring`, `openssl` |
| Database | **MySQL 8.x** or **MariaDB 10.x** recommended for production |
| Web server | Apache + `mod_rewrite`, or nginx with equivalent front-controller routing |
| HTTPS | Strongly recommended for admin JWT and widget sessions |
| Outbound HTTPS | Required for Claude API — confirm the host allows external HTTPS |
| Writable dirs | `storage/uploads/`, `var/` (installer creates `var/installed.lock`) |
| FTP / file manager | Upload release ZIP contents; SSH optional |
| Composer on server | **Not required** — `vendor/` is bundled in the release ZIP |

SQLite is supported by the installer for very small or test installs. It is **not recommended** for production chat traffic.

---

## What you upload

Maintainers build a **release ZIP** with:

```bash
composer release:zip   # see tools/README.md — requires Node.js + NENE2 sibling checkout
```

Operators receive `nene-corpus-<version>.zip` containing:

```text
nene-corpus/
├── public_html/          ← point the web server here (or map as subdirectory)
│   ├── index.php         ← API front controller
│   ├── admin/            ← Admin UI (static SPA)
│   ├── install/          ← Web installer
│   ├── widget.js
│   └── widget.css
├── vendor/               ← PHP dependencies (bundled)
├── src/
├── database/migrations/
├── storage/uploads/      ← empty; must stay writable
├── .env.example
└── …
```

Download from [GitHub Releases](https://github.com/hideyukiMORI/nene-corpus/releases) when published, or obtain the ZIP from your integrator.

---

## Install flow (recommended)

### 1. Upload via FTP

Extract the ZIP locally, then upload the **`nene-corpus/`** folder to your hosting account.

**Typical layouts:**

| Layout | Example URL | Notes |
| --- | --- | --- |
| **Subdirectory** | `https://example.com/nene-corpus/` | Most common — existing site stays at `/` |
| **Subdomain docroot** | `https://corpus.example.com/` | Point subdomain document root at `nene-corpus/public_html/` |

For subdirectory installs, the public URL path (e.g. `/nene-corpus`) is detected automatically and saved as `NENE_CORPUS_BASE_PATH` during install.

### 2. Set permissions

Ensure the web server user can write to:

- `storage/uploads/` — typically `755` or `775`
- `var/` — installer writes `installed.lock` here

Project root (`.env`) must **not** be web-accessible — only `public_html/` is exposed.

### 3. Run the web installer

Open in a browser:

```text
https://example.com/nene-corpus/install/
```

Fill in:

| Field | Notes |
| --- | --- |
| **Base path** | Pre-filled from server detection — usually `/nene-corpus` or empty for subdomain docroot |
| **Database** | MySQL host, name, user, password (create an empty database in hosting panel first) |
| **Admin email / password** | First operator account for Admin UI |
| **Anthropic API key** | Optional during install; required before chat works — can add later |

The installer will:

1. Test the database connection
2. Write `.env` (including `NENE_CORPUS_BASE_PATH` and `NENE2_LOCAL_JWT_SECRET`)
3. Run database migrations
4. Create the admin user
5. Write `var/installed.lock` (blocks re-install)

### 4. Sign in to Admin

```text
https://example.com/nene-corpus/admin/
```

Use the email and password from the installer.

Post-install day-2 operations (ingest, embed, LLM rotation, logs): [`../operations/operator-guide.md`](../operations/operator-guide.md).

### 5. Ingest documents

In Admin → upload CSV or PDF sources, map columns (CSV), and wait for indexing to complete.

Set **Anthropic API key** in environment or hosting panel if not done during install (`ANTHROPIC_API_KEY` in `.env`). After install, operators can rotate the key from **Admin → LLM settings** (masked display, connection test, writes `.env`).

### 6. Embed the widget on your homepage

Add the following to any page on the **same origin** (WordPress custom HTML block, theme footer, static HTML, etc.).

Replace `/nene-corpus` with your **base path** if different (installer shows detected paths at `/install/`):

```html
<script src="/nene-corpus/widget.js" data-endpoint="/nene-corpus" defer></script>
```

- `data-endpoint` — public API base path (same as base path; **no** `/api` suffix). The widget **auto-starts** when the script loads — no extra init block required. The script also injects `widget.css` and the mount `<div>` when they are not already on the page.
- Widget appearance (colors, default language) — configure in Admin → Appearance

The **embed widget** uses **sync JSON chat** (full reply + citations). A loading indicator and CSS motion appear while waiting — no token streaming.

---

## Apache (subdirectory) example

If you map `/nene-corpus/` to `public_html/` and the host uses Apache, `public_html/.htaccess` is included:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

Admin SPA routing uses `public_html/admin/.htaccess`. API routes under the same `/admin/` prefix (`/admin/auth/login`, `/admin/sources`, `/admin/settings/llm`, …) are rewritten to the PHP front controller before the SPA fallback. The release build copies this file from `frontend/apps/admin/public/.htaccess` — keep both in sync.

---

## nginx (subdirectory) sketch

Ask your host or set a location block (paths illustrative):

```nginx
location /nene-corpus/ {
    alias /path/to/nene-corpus/public_html/;
    try_files $uri $uri/ /nene-corpus/index.php?$query_string;

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
    }
}
```

Exact directives vary by host — use their PHP + subdirectory documentation as the source of truth.

---

## Manual install (SSH fallback)

If the web installer is unavailable but you have SSH:

1. Upload the release ZIP contents (or run `composer release:zip` locally and upload).
2. Copy `.env.example` to `.env` and set `DB_*`, `NENE2_LOCAL_JWT_SECRET`, `NENE_CORPUS_BASE_PATH`, `ANTHROPIC_API_KEY`.
3. Run `php vendor/bin/phinx migrate -c phinx.php` from the project root.
4. Insert an admin user into `admin_users` (password: `password_hash()` with Argon2id).
5. `touch var/installed.lock` to disable the browser installer.
6. Ensure `storage/uploads/` is writable.

Prefer the **web installer** when FTP-only access is enough.

---

## After install checklist

- [ ] `https://example.com/nene-corpus/health` returns `{"status":"ok",…}`
- [ ] Admin login works at `/nene-corpus/admin/`
- [ ] At least one CSV or PDF source ingested
- [ ] `ANTHROPIC_API_KEY` set — test a question in the embed widget
- [ ] Embed snippet added to the public homepage
- [ ] HTTPS enabled on the domain

---

## Limitations on shared hosting

- **PDF ingestion** may hit PHP `max_execution_time` and upload size limits — split large files or use Tier B (Docker/VPS) for heavy ingestion.
- **Claude API** is pay-as-you-go — monitor usage in your Anthropic account.
- **SSE / token streaming** is not supported — sync JSON chat only (see ADR 0003).
- **Consumer MCP** is not exposed to the widget — admin/ops only.

---

## Conversation log metadata

When a visitor starts a chat session, NeNe Corpus records the client IP (`REMOTE_ADDR`), `User-Agent`, and optional `Referer` header on the `chat_sessions` row. Admins view these in **Conversation logs**.

| Topic | Guidance |
| --- | --- |
| **Personal data** | IP addresses and User-Agent strings may identify individuals or devices. Handle logs according to your privacy policy and applicable law (e.g. APPI, GDPR). |
| **Retention** | Sessions persist until you delete them (a configurable retention policy may be added later). Do not enable chat if your policy forbids storing this metadata. |
| **Reverse proxies** | Client IP is taken from `REMOTE_ADDR` only — the same policy as chat rate limiting. Behind nginx or a load balancer, configure the web server so `REMOTE_ADDR` reflects the real visitor IP; otherwise the logged value will be the proxy address. |

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Admin login shows “Non-JSON response” / HTML | `public_html/admin/.htaccess` must route `auth`, `sources`, etc. to `../index.php` — not SPA `index.html` |
| 404 on `/admin/` routes | `public_html/admin/.htaccess` present; `mod_rewrite` enabled |
| 404 on API (`/health`, `/chat/…`) | `public_html/.htaccess` present; requests reach `index.php` |
| Installer returns “already installed” | `var/installed.lock` exists — delete only if intentionally re-installing |
| Database connection failed | Host name (often not `localhost` on shared hosts), user grants, empty database created |
| Chat returns errors | `ANTHROPIC_API_KEY` in `.env`; outbound HTTPS allowed |
| Widget loads but chat fails | `data-endpoint` matches base path; same origin as API |
| Wrong asset paths | `NENE_CORPUS_BASE_PATH` in `.env` matches URL prefix; re-run install or fix manually |

Host-specific fixes — document in GitHub Issues/PRs as they appear.

---

## Related

- Release ZIP build: [`../../tools/README.md`](../../tools/README.md)
- Engineer / VPS path: [`developer.md`](./developer.md)
- ADR 0003: [`../adr/0003-dual-deployment-and-embed-widget.md`](../adr/0003-dual-deployment-and-embed-widget.md)
- Product vision: [`../explanation/product-vision.md`](../explanation/product-vision.md)
- Glossary: [`../explanation/glossary.md`](../explanation/glossary.md)
