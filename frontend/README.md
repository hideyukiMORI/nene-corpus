# NeNe Corpus Frontend

Phase 3 monorepo — React **admin** (Tailwind) and **embed widget** (BEM + CSS variables).

## Layout

```
frontend/
  apps/admin/          # Admin SPA (Tailwind)
  apps/widget/         # embed widget → widget.js
  packages/tokens/     # CSS var names + BEM class constants
  packages/api-client/ # snake_case API types + fetch helpers
  themes/              # Widget theme files (swap default.css to retheme)
```

Policy: [`docs/development/frontend-standards.md`](../docs/development/frontend-standards.md)

## Commands

```bash
npm install --prefix frontend
npm run check --prefix frontend
npm run build --prefix frontend
npm run dev:admin --prefix frontend
npm run dev:widget --prefix frontend
```

Widget production build writes `public_html/widget.js` (same-origin embed).
