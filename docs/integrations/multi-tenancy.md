# Multi-Tenancy — 概要と URL 構造

> **フェーズ**: Phase 4 バックログ。現時点では `single` モードのスタブ実装。
> 詳細設計は Issue 化後に記載する。

---

## URL 構造

Admin SPA は起動時に `GET /admin/bootstrap` を fetch して `tenant_resolution_mode` と
`tenant_org_slug` を取得し、これに基づいて URL を構築する。

### 構成要素

```
{install-base}/{org-slug?}/{route}
```

| 構成要素 | 例 | 説明 |
|---|---|---|
| `install-base` | `/admin` または `` | サブディレクトリ配置時のみ付く。`window.location.pathname` から自動検出（`config.ts` の `resolveAdminApiBase` 参照）。 |
| `org-slug` | `acme` | **`tenant_resolution_mode === 'path'` の時のみ** URL に含まれる。 |
| `route` | `/dashboard` `/sources` `/settings` | アプリ内ルート。 |

### mode 別の URL 例

| mode | URL 例 | org 解決方法 |
|---|---|---|
| `single` | `/admin/dashboard` | system_config の固定 slug（`default`） |
| `subdomain` | `/admin/dashboard`（hostname は `acme.example.com`） | hostname のサブドメイン |
| `path` | `/admin/acme/dashboard` | URL の先頭セグメント（`acme`） |

### install-base の検出

Tier A 環境では Admin が `/nene-corpus/admin/` のようなサブディレクトリに配置される場合がある。
`config.ts` の `resolveAdminApiBase()` が `pathname` を検査して `/admin` の手前のプレフィックス
を `installBase` として返す。

```
pathname: /nene-corpus/admin/
installBase: /nene-corpus
```

Docker（Tier B）では `pathname` が `/admin/...` のみなので `installBase` は空文字列になる。

---

## GET /admin/bootstrap

フロントエンドが起動時に取得する public endpoint（認証不要）。

**レスポンス例（single モード）:**
```json
{
  "tenant_resolution_mode": "single",
  "tenant_org_slug": "default"
}
```

**レスポンス例（path モード、将来）:**
```json
{
  "tenant_resolution_mode": "path",
  "tenant_org_slug": "acme"
}
```

現フェーズは常に `single` / `default` を返すスタブ。Phase 4 で DB/env から読み取るよう差し替え予定。

---

## SPA fallback (.htaccess)

path-based routing では、ブラウザの直打ち（`/admin/acme/dashboard`）や再読み込みでも
`index.html` が返る必要がある。`public_html/admin/.htaccess` と
`frontend/apps/admin/public/.htaccess` の両方に SPA fallback ルールを追加している。

```apache
# Static files are served as-is.
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# SPA fallback
RewriteCond %{REQUEST_URI} !^.*\.(?:js|css|map|png|jpg|...)$
RewriteRule . index.html [QSA,L]
```

---

## 関連

- ADR 0006: `docs/adr/0006-path-based-routing.md`
- Issue: `#289`
