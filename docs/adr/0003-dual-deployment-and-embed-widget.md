# ADR 0003: Dual Deployment and Embed Widget

## Status

accepted

## Context

NeNe Corpus targets self-hosted knowledge chat for small and medium businesses. In Japan, many operators already run company websites on **PHP-capable shared hosting** (FTP upload, MySQL, same domain as their public site). Developers and VPS operators prefer **Docker Compose** for reproducible setup.

These audiences share the same product (corpus, cited chat, admin UI) but need different **installation paths**. The consumer chat use case is typically **low frequency** (rate limits per session/IP, not high-throughput streaming), so token-by-token SSE is a UX enhancement, not a core requirement.

Alternatives considered:

1. **Docker-only** — rejected for Japan SMB reach; shared hosting is the larger addressable market.
2. **Shared-hosting-only** — rejected; developers and VPS users need a fast, reproducible path.
3. **Dual deployment, single codebase** (chosen): same API and widget; Tier A and Tier B differ in packaging and docs only.

## Decision

NeNe Corpus supports **two deployment tiers** with one runtime codebase:

| Tier | Audience | Install path | Chat transport |
| --- | --- | --- | --- |
| **A — Shared hosting** | Japan SMB primary | ZIP + web installer + FTP/SSH; MySQL | **sync JSON chat** (default) |
| **B — Docker / VPS** | Developers, VPS, private cloud | `docker compose up` | **sync JSON chat** (default); **SSE streaming** optional later |

**Product delivery:**

- **Embed widget:** one `<script>` tag on any page under the **same origin** as the NeNe Corpus install (existing WordPress, static HTML, or other CMS pages).
- **Not a WordPress plugin** — coexist on the same server and domain; no WP theme/DB integration.
- **WordPress-like adoption feel** for Tier A: web installer, admin UI as primary operator surface, minimal CLI for day-to-day use (implementation in Phase 3).

**Chat API (Phase 2):**

- Default (**sync JSON chat**): `POST` message → wait → JSON response with full text and `citations[]`.
- Optional later (Tier B — **SSE streaming**): progressive display endpoint.

**Markets:**

- **Primary:** Japan SMB on **Tier A** **shared hosting**.
- **Secondary:** **Tier B** VPS/Docker self-hosters globally; Southeast Asia and EU where data sovereignty matters (internationalization and extra channels are follow-up, not Phase 1 blockers).

## Consequences

**Benefits**

- Largest Japan SMB segment remains in scope without forking the product.
- Developers keep Docker as the authoritative dev and Tier B path.
- **sync JSON chat** improves shared-hosting compatibility (timeouts, proxies, no long-lived connections).
- Clear **embed widget** story for existing homepages.

**Costs**

- Two deployment doc tracks and a broader smoke-test matrix.
- Tier A requires **release ZIP** packaging and **web installer** (Phase 3 deliverables).
- PHP version support for Tier A may need a wider floor (e.g. 8.2+) than dev-only 8.4 — track in Phase 1 Issues.

**Follow-up**

- `docs/deployment/shared-hosting.md` — Tier A operator guide (stub until installer lands).
- `docs/development/docker.md` — Tier B (existing).
- Phase 2 OpenAPI: document **sync JSON chat** first; **SSE streaming** as optional extension.
- Phase 3: **web installer**, **release ZIP**, **embed widget** bundle.
- Terminology: `docs/explanation/glossary.md`, `docs/development/naming-conventions.md`.

## Related

- Issue: #3
- Product vision: `docs/explanation/product-vision.md`
- Deployment index: `docs/deployment/README.md`
- Docker development: `docs/development/docker.md`
