# Product Vision

NeNe Corpus is a self-hosted knowledge chat platform built on [NENE2](https://github.com/hideyukiMORI/NENE2). This document records why the product exists, what it optimizes for, and how it relates to the NeNe ecosystem.

## Origin

Many small and medium businesses sit on valuable **public-facing** information — product catalogs, PDF spec sheets, pairing guides, FAQs — that never becomes searchable or conversational on their own website. SaaS chatbots rent access to your data and charge recurring fees. NeNe Corpus offers an alternative: **run the corpus and chat stack on infrastructure you control**, with source code you can audit, and pay for the **LLM API** on usage rather than a fixed chatbot subscription.

The product showcases NENE2's strengths: OpenAPI-first APIs, Clean Architecture, MCP-ready ops boundaries, and field-trial-grade security discipline — in a **real application**, not a demo endpoint.

## North Star

Operators and developers can:

- upload PDF and CSV (later: more formats) through an admin UI
- inspect how documents were chunked and indexed
- expose a consumer chat widget that answers **with citations**
- audit conversations, rate limits, and token usage
- optionally connect [NeNe Records](https://github.com/hideyukiMORI/nene-records) or other HTTP APIs as upstream sources

End users get fast, grounded answers. Operators keep data sovereignty.

NeNe Corpus is **not** a PHP framework. It is a **product** that consumes NENE2.

## Target operators and markets

**Primary — Japan SMB on Tier A shared hosting**

Operators who already have a company website on **shared hosting** and want a FAQ / manual **consumer chat** **without SaaS lock-in**. Adoption should feel as approachable as WordPress: upload, **web installer**, manage from admin UI — **not** as a WordPress plugin, but as a sibling app on the **same origin**.

**Secondary — Tier B developers and VPS / private cloud**

Docker Compose for local dev and production on VPS. Same API and **embed widget** as Tier A.

**Later — international**

Southeast Asia and EU operators who value data sovereignty. May need multilingual UI and messaging-app channels; not Phase 1 blockers.

## Primary use case

NeNe Corpus optimizes for **consumer-facing search assistants on an existing company website**:

- Corpus content is **already public or intended for the site** — product lines, spec PDFs, how-to guides, pairing or usage notes.
- Visitors ask questions through the **embed widget**; answers include **citations** back to ingested chunks.
- Operators accept that matched corpus text is sent to the **Claude API** server-side for reasoning — appropriate for public marketing and support content, not for undisclosed trade secrets.

**Not the primary story:** internal LAN deployments where confidential documents must never leave the network, then exposing the same assistant anonymously on the public web. Tier B (Docker/VPS) serves developers and controlled hosting; the **product narrative** leads with Tier A SMB operators who want a homepage assistant without a SaaS subscription.

## Primary persona

A fictional but representative operator:

> A small regional **food or beverage maker** with a wide product range (many SKUs, seasonal labels). The company site runs on **shared hosting**. A **non-engineer** staff member — often general affairs or marketing — already publishes updates through WordPress or a similar CMS. Leadership asks for an **AI search assistant on the homepage** so visitors can ask about products, ingredients, and serving suggestions. Budget allows **initial setup** and **pay-as-you-go LLM usage**; a **monthly chatbot SaaS** is a hard sell. After Phase 3, they should install via **web installer**, upload PDFs/CSV, copy the **embed widget** snippet, and report success without hiring a developer.

The same pattern applies to **equipment manufacturers**, **specialty retailers**, and other catalog-heavy SMBs: many products, modest web budget, staff who can manage uploads but not Docker.

## Dual deployment

Same codebase, two installation paths (ADR 0003):

| Tier | Path | Chat transport |
| --- | --- | --- |
| **Tier A — shared hosting** | **release ZIP** + **web installer** + MySQL | **sync JSON chat** |
| **Tier B — Docker / VPS** | `docker compose up` | **sync JSON chat** |

See [`docs/deployment/README.md`](../deployment/README.md) and [`glossary.md`](./glossary.md).

## Embed on existing sites

**Consumer chat** is added to an **existing homepage** with one script tag on the **same origin** (**embed widget**):

```html
<script src="/nene-corpus/widget.js" data-endpoint="/nene-corpus/api" defer></script>
```

No site rebuild required. Works with WordPress themes, static HTML, or any CMS that allows a custom script include.

FAQ-style traffic is **low frequency** (**rate limit** per session/IP). **sync JSON chat** with a loading state and widget CSS motion (bubble fade-in, smooth scroll) is sufficient. **SSE streaming** is a **non-goal**.

## Philosophy

### 1. Self-hosted OSS first

MIT license. **Dual deployment:** Docker Compose for Tier B; **web installer** + **release ZIP** for Tier A **shared hosting**. No mandatory cloud vendor.

### 2. Citations are the contract

Every assistant message should cite corpus chunks (document id, page, section). "I don't know" is preferable to uncited speculation.

### 3. Separation from NeNe Records

NeNe Records owns structured CMS content. NeNe Corpus owns ingestion, chunking, chat sessions, and LLM orchestration. **Integration is HTTP-only.** See ADR 0002.

```
NENE2 (framework)
  ├── NeNe Records (CMS — optional upstream)
  └── NeNe Corpus (knowledge chat — this repo)
```

### 4. Extreme responsibility separation

| Layer | Responsibility |
| --- | --- |
| **NENE2 runtime** | HTTP, DI, middleware, Problem Details |
| **NeNe Corpus API** | Ingestion, corpus storage, chat, rate limits, audit |
| **Admin UI** | Upload, reindex, logs, prompt settings, **embed widget** snippet |
| **Embed widget** | **Consumer chat** UX over **sync JSON chat** (CSS loading/motion; no token streaming) |
| **Claude API** | Reasoning + tool_use (server-side only) |
| **Upstream APIs** | NeNe Records public/search APIs (read-only client) |
| **MCP tools** | Ops read-only — never consumer-facing |

### 5. AI-native by contract

MCP tools map to OpenAPI operations for operators and agents. Consumer chat never speaks MCP. LLM tool definitions are derived from documented HTTP boundaries.

### 6. Readable to humans and agents

Explicit domain modules, small use cases, typed DTOs, ADRs, Issue-driven workflow — inherited from NENE2 governance (ADR 0001).

## Comparison

| Aspect | SaaS chatbot | Self-hosted RAG (Docker-first) | NeNe Corpus |
| --- | --- | --- | --- |
| License / initial cost | Subscription | OSS (no license fee) | OSS (no license fee) |
| Running cost | Fixed monthly fee | Infra + LLM API usage | Hosting + **LLM API usage** |
| Data location | Vendor cloud | Your infra | Your DB + storage |
| Typical adoption | Low (vendor onboarding) | Often requires Docker / ops comfort | **WordPress-like** on Tier A (target) |
| Homepage embed | Vendor widget | Varies | **embed widget** — one same-origin `<script>` |
| Citations | Varies | Varies | **Core product promise** |
| Japanese admin UI | Vendor-dependent | Varies | Planned (Phase 3) |
| CMS upstream | Bundled or separate | N/A | Optional NeNe Records (HTTP) |
| Deploy | Vendor-hosted | Usually Tier B–style | **Tier A** shared hosting or **Tier B** Docker/VPS |

## Relationship to NENE2

```
NENE2          → framework (Packagist: hideyukimori/nene2)
NeNe Corpus    → product (this repository)
NeNe Records   → sibling CMS (optional upstream)
```

- Framework changes belong in NENE2.
- Corpus model, chat UX, ingestion, and product MCP tools belong here.
- See `docs/inheritance-from-nene2.md` for governance boundaries.

## Non-goals

- Rebuilding Laravel/Symfony or a generic RAG framework
- **WordPress plugin** or theme integration (coexist on same domain is fine)
- Notion / WordPress content import as a primary goal
- Embedding chat into NeNe Records
- Exposing MCP to end-user chat clients
- Direct database access for LLM or MCP tools
- Subscription-only SaaS as the primary delivery model
- Docker-only deployment (shared hosting must remain a first-class path)
- **Primary positioning** as an internal confidential-document appliance whose answers are exposed to anonymous public visitors — operators must ingest only content suitable for public Q&A and Claude API transmission

## Naming

Product display names (reserved policy — full rules in a follow-up Issue):

- **NeNe Corpus** — a body of knowledge you own.
- **NeNe Records** — typed records you edit (optional upstream).

All other terms: [`glossary.md`](./glossary.md). Code and API naming: [`naming-conventions.md`](../development/naming-conventions.md).
