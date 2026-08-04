# Frontend Standards

NeNe Corpus admin UI and **embed widget** — TypeScript, React, OpenAPI-aligned API client.

Naming index: [`naming-conventions.md`](./naming-conventions.md) §9. Product terms: [`glossary.md`](../explanation/glossary.md).

---

## 1. Layout — one package, one `src/` tree

npm workspaces were removed in #368. Both deliverables are built from a single tree by two Vite configs (the fleet-wide shape for multi-deliverable products).

```
frontend/
  index.html                     # admin entry
  widget-dev.html                # widget dev page (:5290/widget-dev.html)
  vite.config.ts                 # admin build   → public_html/admin/
  vite.widget.config.ts          # widget build  → public_html/widget.js
  vitest.config.ts
  tests/                         # vitest infrastructure (msw / setup) — `@tests` alias
  themes/                        # widget theme files (swap to retheme)
  src/
    main.tsx                     # admin entry
    *.tsx  v2/                   # flat admin — being re-layered into FSD by #361 P4
    app/widget/                  # consumer embed — BEM + CSS variables → widget.js
    shared/api/                  # snake_case API types + transport
    shared/i18n/                 # message keys + locale catalogs + LocaleProvider
    shared/config/widget-tokens/ # CSS var names + BEM class constants
```

The target is the FSD five layers (`app` / `pages` / `features` / `entities` / `shared`); the flat files directly under `src/` are the remainder of the pre-rebuild layout and are removed by #361 P4.

Imports across directories use the `@/` alias (`@` = `src/`, `@tests` = `tests/`); only same-directory imports are relative.

**Do not share styled React components** between admin and widget: `shared/ui` is Tailwind-based and belongs to admin, while the widget's presentational parts live under `app/widget/` and use BEM only. Sharing **tokens**, **api-client**, and **i18n** is fine (both use `@/shared/i18n` with separate `localStorage` keys).

---

## 2. Styling strategy (dual stack)

| Surface | Stack | Notes |
| --- | --- | --- |
| **Admin** | Tailwind CSS v4 | Fast iteration; isolated SPA — no host CSS collision |
| **Embed widget** | BEM + CSS custom properties | `nene-corpus-` prefix; theme in `frontend/themes/*.css` |

### Widget rules

- Class names via `@/shared/config/widget-tokens` constants (`nc.chatBubble`) — never ad-hoc strings in JSX.
- Component CSS references `var(--nc-*)` only — no hard-coded brand colors in `widget.css`.
- **Theme swap:** replace or override `themes/default.css` (operator runtime overrides land in Phase 3+).
- Host page loads theme CSS + `widget.js` on the **same origin**.

### Admin rules

- Tailwind utility classes in TSX.
- Preview widget appearance in an **iframe** when appearance settings ship — do not import widget CSS into admin.

---

## 3. API client

- JSON field names stay **snake_case** — match OpenAPI exactly.
- Types live in `@/shared/api`; extend from `docs/openapi/openapi.yaml` when routes change.
- Admin JWT and consumer `X-Session-Token` are separate — never use admin JWT in the widget.

---

## 4. Internationalization (`@/shared/i18n`)

- UI strings live in locale catalogs — **never hard-code user-facing copy** in components (migrate incrementally).
- Message keys are defined once in `src/shared/i18n/keys.ts` as the `Msg` constant tree; components call `t(Msg.admin.sources.title)`.
- Supported locales match NENE2 docs: `en`, `ja`, `fr`, `zh-Hans`, `pt-BR`, `de`.
- OpenAPI / API error `code` / Problem Details stay **English** (NENE2 language policy); only client UI is localized.
- Wrap admin and widget roots with `LocaleProvider`. Admin: `nene-corpus.admin.locale`; widget: `nene-corpus.widget.locale`. Initial locale: `localStorage` → browser language → `en`.
- Admin header exposes a locale `<select>` (`LocaleSelector`) — preference is **localStorage only** (no server persistence).
- **Typography (Admin):** locale-aware stacks via `@fontsource` — Inter (Latin locales), Noto Sans JP (`ja`), Noto Sans SC (`zh-Hans`). Bundled in admin only; `--nc-admin-font-family` on `:root` drives Tailwind `font-sans`. Widget unchanged.
- **Theme (Admin):** light/dark via CSS variables on `:root` / `.dark`. Toggle in header; persist `nene-corpus.admin.theme` (`light` | `dark`, default from `prefers-color-scheme`). Small radius tokens (`rounded-admin*` ≈ 4–8px), subtle page gradient, glassy header (`backdrop-blur`). Reuse `nc-panel`, `nc-input`, `nc-btn*` component classes.
- Use `formatTimestamp(value, locale)` for locale-aware dates.
- Pair labels with optional help via `HelpLabel` (`label` + `help` strings from `Msg.*Help` keys). Tooltip opens on hover and keyboard focus; use `\n` in help strings for line breaks. CSV column mapping also has a collapsible `ColumnMappingGuide` accordion after preview.
- **`keys.ts` を更新したあと** dev サーバーが古い `Msg` ツリーを返すことがある（プレビュー真っ白・ボタン空文字）。**admin (:5289) と widget (:5290) を両方再起動**する（`npm run dev:admin --prefix frontend` / `npm run dev:widget --prefix frontend`）。`resolveMsgKey(Msg.*, 'literal.key')` で HMR 遅延時もフォールバック可能（`src/shared/i18n/resolve-msg-key.ts`）。**モジュール初期化時に `Msg.*` を読む配列定義は避け**、文字列リテラルキーを使う（例: `helpSections.ts`）。

---

## 5. Build outputs

| App | Command | Output |
| --- | --- | --- |
| Admin (dev) | `npm run build:admin --prefix frontend` | `frontend/dist/` |
| Admin (release) | `npm run build:release:admin --prefix frontend` | `public_html/admin/` |
| Widget | `npm run build:widget --prefix frontend` | `public_html/widget.js` (+ `widget.css`) |
| **Tier A ZIP** | `composer release:zip` | `build/release/nene-corpus-<git-sha>.zip` |

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

- Tailwind inside `src/app/widget/` (a third-party host page must not receive our preflight)
- Importing widget CSS from admin (except iframe preview)
- Renaming OpenAPI JSON fields in the client layer
- Exposing MCP or admin JWT to the embed bundle
