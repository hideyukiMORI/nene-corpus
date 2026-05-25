# Frontend Standards

NeNe Corpus admin UI and **embed widget** — TypeScript, React, OpenAPI-aligned API client.

Naming index: [`naming-conventions.md`](./naming-conventions.md) §9. Product terms: [`glossary.md`](../explanation/glossary.md).

---

## 1. Monorepo layout

```
frontend/
  apps/admin/           # Admin SPA — Tailwind
  apps/widget/          # Consumer embed — BEM + CSS variables → widget.js
  packages/tokens/      # CSS var names + BEM class constants (shared)
  packages/api-client/  # snake_case API types + fetch helpers
  packages/i18n/        # Message keys + locale catalogs + LocaleProvider
  themes/               # Widget theme files (swap to retheme)
```

**Do not share styled React components** between admin and widget. Share **tokens**, **api-client**, and **i18n** (admin and widget both use `@nene-corpus/i18n`; separate `localStorage` keys).

---

## 2. Styling strategy (dual stack)

| Surface | Stack | Notes |
| --- | --- | --- |
| **Admin** | Tailwind CSS v4 | Fast iteration; isolated SPA — no host CSS collision |
| **Embed widget** | BEM + CSS custom properties | `nene-corpus-` prefix; theme in `frontend/themes/*.css` |

### Widget rules

- Class names via `@nene-corpus/tokens` constants (`nc.chatBubble`) — never ad-hoc strings in JSX.
- Component CSS references `var(--nc-*)` only — no hard-coded brand colors in `widget.css`.
- **Theme swap:** replace or override `themes/default.css` (operator runtime overrides land in Phase 3+).
- Host page loads theme CSS + `widget.js` on the **same origin**.

### Admin rules

- Tailwind utility classes in TSX.
- Preview widget appearance in an **iframe** when appearance settings ship — do not import widget CSS into admin.

---

## 3. API client

- JSON field names stay **snake_case** — match OpenAPI exactly.
- Types live in `@nene-corpus/api-client`; extend from `docs/openapi/openapi.yaml` when routes change.
- Admin JWT and consumer `X-Session-Token` are separate — never use admin JWT in the widget.

---

## 4. Internationalization (`@nene-corpus/i18n`)

- UI strings live in locale catalogs — **never hard-code user-facing copy** in components (migrate incrementally).
- Message keys are defined once in `packages/i18n/src/keys.ts` as the `Msg` constant tree; components call `t(Msg.admin.sources.title)`.
- Supported locales match NENE2 docs: `en`, `ja`, `fr`, `zh-Hans`, `pt-BR`, `de`.
- OpenAPI / API error `code` / Problem Details stay **English** (NENE2 language policy); only client UI is localized.
- Wrap admin and widget roots with `LocaleProvider`. Admin: `nene-corpus.admin.locale`; widget: `nene-corpus.widget.locale`. Initial locale: `localStorage` → browser language → `en`.
- Admin header exposes a locale `<select>` (`LocaleSelector`) — preference is **localStorage only** (no server persistence).
- **Typography (Admin):** locale-aware stacks via `@fontsource` — Inter (Latin locales), Noto Sans JP (`ja`), Noto Sans SC (`zh-Hans`). Bundled in admin only; `--nc-admin-font-family` on `:root` drives Tailwind `font-sans`. Widget unchanged.
- **Theme (Admin):** light/dark via CSS variables on `:root` / `.dark`. Toggle in header; persist `nene-corpus.admin.theme` (`light` | `dark`, default from `prefers-color-scheme`). Small radius tokens (`rounded-admin*` ≈ 4–8px), subtle page gradient, glassy header (`backdrop-blur`). Reuse `nc-panel`, `nc-input`, `nc-btn*` component classes.
- Use `formatTimestamp(value, locale)` for locale-aware dates.
- Pair labels with optional help via `HelpLabel` (`label` + `help` strings from `Msg.*Help` keys). Tooltip opens on hover and keyboard focus; use `\n` in help strings for line breaks. CSV column mapping also has a collapsible `ColumnMappingGuide` accordion after preview.

---

## 5. Build outputs

| App | Command | Output |
| --- | --- | --- |
| Admin | `npm run build -w @nene-corpus/admin` | `frontend/apps/admin/dist/` |
| Widget | `npm run build -w @nene-corpus/widget` | `public_html/widget.js` (+ `widget.css`) |

Public embed file name is fixed: **`widget.js`** (glossary: **embed widget**).

---

## 6. Verification

```bash
npm install --prefix frontend
npm run check --prefix frontend
npm run build --prefix frontend
composer check   # backend unchanged
```

---

## 7. Prohibited

- Tailwind inside `apps/widget/`
- Importing widget CSS from admin (except iframe preview)
- Renaming OpenAPI JSON fields in the client layer
- Exposing MCP or admin JWT to the embed bundle
