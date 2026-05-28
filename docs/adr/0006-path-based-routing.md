# ADR 0006: Admin SPA を hash router から mode-aware path router に切り替える

## Status

accepted

## Context

### 問題

Admin SPA は当初 `window.location.hash`（`#/dashboard` 等）でルーティングを実装していた。
この方式には以下の課題がある。

1. **URL の見通しが悪い** — `#` 以降はサーバーに送られないため、ブラウザの直打ちで正しいページに届かない（すべて `/admin/` にフォールバックし、クライアントが `#` を解析して初めてルートが確定する）。
2. **multi-tenant 対応が困難** — `path` モード（`/admin/{org-slug}/dashboard`）では org-slug をパスセグメントとして持つ必要があり、hash では表現できない。
3. **SEO / ディープリンク** — ダッシュボードの特定ページを直リンクで共有できない。

### 制約

- Tier A（共用ホスティング）では `mod_rewrite` のみが利用可能。Node.js / Nginx はない。
- 同一コードベースで `single` / `subdomain` / `path` の 3 種の tenant_resolution_mode に対応する必要がある。
- フロントエンドは起動時にバックエンドから mode と slug を取得しなければならない（静的ビルドに焼き込めない）。

## Decision

### 1. バックエンド: `GET /admin/bootstrap`

- 認証不要の public endpoint として新設。
- レスポンス: `{ "tenant_resolution_mode": "single", "tenant_org_slug": "default" }`
- `AdminBearerTokenMiddleware` のバイパスリストに `/admin/bootstrap` を追加。
- 現フェーズ（pre-tenancy）は常に `single` / `default` を返すスタブ実装。

### 2. フロントエンド: mode-aware Router

- `frontend/apps/admin/src/v2/router/` に `RouterProvider` / `Link` / `useRoute` / `useNavigate` を新設。
- 起動時に `GET /admin/bootstrap` を fetch して `mode` と `orgSlug` を取得。
- URL 構造:

| mode | URL 例 |
|---|---|
| `single` | `/admin/dashboard` |
| `subdomain` | `/admin/dashboard`（hostname で org 解決） |
| `path` | `/admin/acme/dashboard` |

### 3. SPA fallback (.htaccess)

- `/admin/.htaccess` に `RewriteCond / RewriteRule` を追加して、実ファイル以外のリクエストはすべて `index.html` にフォールバック。
- `mod_rewrite` で実装するため Tier A 共用ホスティングでも動作する。

### 4. hash router の廃止

- `App.tsx` の `hashchange` リスナーと `window.location.hash` 参照を全削除。
- 全 v2 page / Sidebar のリンクを `useNavigate()` / `<Link>` に置換。

## Consequences

### プラス

- `http://localhost:5273/dashboard` のような URL 直打ちが動作する。
- ブラウザの戻る/進むボタンが標準 History API で動作する。
- `path` モード時の multi-tenant URL（`/admin/acme/dashboard`）に対応できる。

### マイナス・コスト

- `.htaccess` の SPA fallback が必要になるため、Apache `mod_rewrite` なし環境（素の PHP built-in server 等）では追加設定が必要。
- `GET /admin/bootstrap` の fetch が完了するまで `isReady` が false になるため、初期表示に約 1 RTT の遅延が発生する。
  - ネットワーク障害時は `single` モードにフォールバックするため UX への影響は最小限。

### フォローアップ

- Phase 4 でフル Tenancy 実装時に `GetBootstrapInfoUseCase` を DB/env 読み取りに差し替える。
- `subdomain` モードの org 解決ロジック（hostname パース）は Tenancy PR で実装予定。

## Related

- Issue: `#289`
- PR: `#290`（予定）
- Supersedes: none
- Superseded by: none
