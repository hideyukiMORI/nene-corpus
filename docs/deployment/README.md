# Deployment

NeNe Corpus supports **dual deployment** — same product, two installation paths. See ADR 0003 and [`glossary.md`](../explanation/glossary.md).

| Tier | Document | Audience |
| --- | --- | --- |
| **Tier A — shared hosting** | [`shared-hosting.md`](./shared-hosting.md) | Japan SMB — FTP + web installer |
| **Tier B — Docker / VPS** | [`../development/docker.md`](../development/docker.md) | Developers, reproducible stacks |
| **Tier B — git clone** | [`developer.md`](./developer.md) | Engineers beside an existing system |

## Quick reference

### Tier A — shared hosting (operators)

1. Download **release ZIP** (or obtain from your integrator).
2. Upload `nene-corpus/` via FTP; map URL to `public_html/`.
3. Open **`/install/`** in a browser — database, admin account, optional API keys.
4. Sign in at **`/admin/`**, ingest CSV/PDF, embed **widget** on your homepage.

Full guide: [`shared-hosting.md`](./shared-hosting.md)

### Tier B — Docker / VPS (developers)

```bash
git clone https://github.com/hideyukiMORI/nene-corpus.git
cd nene-corpus
cp .env.example .env
docker compose up --build -d
curl -fsS http://localhost:8080/health
```

Details: [`../development/docker.md`](../development/docker.md)

## Embed on an existing site

After install, add the **embed widget** on any **same-origin** page. Replace `/nene-corpus` with your base path:

```html
<script src="/nene-corpus/widget.js" data-endpoint="/nene-corpus" defer></script>
```

Copy the snippet from **Admin → Appearance** after sign-in. The widget auto-starts when the script loads.

**Same origin** avoids CORS complexity on shared hosting. See [`shared-hosting.md`](./shared-hosting.md) for subdirectory and WordPress notes.

## Chat transport

- **Both tiers:** **sync JSON chat** only — POST a message, receive full reply + **citations**.
- **Embed widget** adds loading indicators and CSS motion; no token streaming.
- **Non-goal:** **SSE streaming** — not planned (ADR 0003).
