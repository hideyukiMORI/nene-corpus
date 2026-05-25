# Deployment

NeNe Corpus supports **dual deployment** — same product, two installation paths. See ADR 0003.

| Tier | Document | Audience |
| --- | --- | --- |
| **A — Shared hosting** | [`shared-hosting.md`](./shared-hosting.md) | Japan SMB, PHP hosting + MySQL |
| **B — Docker / VPS** | [`../development/docker.md`](../development/docker.md) | Developers, VPS, private cloud |

## Quick reference

**Tier B (available now — development and VPS):**

```bash
cp .env.example .env
docker compose up --build -d
curl -fsS http://localhost:8080/health
```

**Tier A (operator guide — web installer in Phase 3):**

See [`shared-hosting.md`](./shared-hosting.md).

## Embed on an existing site

After install, add the widget with one script tag on any page **under the same origin**:

```html
<script
  src="/nene-corpus/widget.js"
  data-endpoint="/nene-corpus/api"
  defer
></script>
```

Exact paths and attributes will be documented when the widget ships (Phase 3). Same-origin avoids CORS complexity on shared hosting.

## Chat transport

- **Default (both tiers):** synchronous JSON — POST a message, receive full reply + citations.
- **Optional (Tier B, later):** SSE streaming for progressive display.

Low-frequency FAQ-style traffic (rate limits per session/IP) does not require streaming.
