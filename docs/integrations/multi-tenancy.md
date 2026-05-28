# Multi-tenancy — 設定ガイド

NeNe Corpus はシングルテナントとマルチテナントの両方に対応しています。テナント解決方式は **superadmin** が管理画面または初期マイグレーションから設定します。

---

## テナント解決モード（3 種類）

| モード | 動作 | 実装状態 |
|--------|------|---------|
| `single` | `tenant_org_slug` で固定した 1 組織のみ運用 | ✅ 実装済み（デフォルト） |
| `subdomain` | リクエストのサブドメインで組織を特定 | 将来拡張（stub 配置済み） |
| `path` | URL パスプレフィックスで組織を特定 | 将来拡張（stub 配置済み） |

### single モード（デフォルト）

既存の全インストールはこのモードで動作します。`system_config` テーブルの `tenant_org_slug` に固定した組織スラッグを設定します。

```
tenant_resolution_mode = single
tenant_org_slug        = default
tenant_base_domain     = (NULL)
```

### subdomain モード（将来拡張）

`chat.org-a.example.com` のようにサブドメインで組織を判別します。`tenant_base_domain = example.com` と設定すると、`chat.org-a.example.com` → スラッグ `org-a` の組織に解決されます。

### path モード（将来拡張）

`/org-a/chat/` のような URL パスプレフィックスで組織を判別します。embed widget の埋め込みスクリプトに `data-org` 属性を付加します。

---

## 初期セットアップ（マイグレーション経由）

Docker 環境での初回セットアップ:

```bash
# コンテナ内
composer migrate        # Tenancy マイグレーション実行
# → organizations テーブル、system_config テーブル、
#    既存テーブルへの organization_id カラム追加、
#    default 組織（id=1）の作成が行われる
```

初期マイグレーション後、`system_config` テーブルには以下のデフォルト値が挿入されます。

```sql
INSERT INTO system_config (tenant_resolution_mode, tenant_org_slug)
VALUES ('single', 'default');
```

---

## superadmin UI から設定する

1. superadmin アカウントでログインする
2. 「設定」→「スーパー管理者」タブを開く
3. 「テナント解決方式」セクションで mode ラジオボタンを選択する
4. single モードの場合: 「組織スラッグ」に使用する org スラッグを入力する
5. 「保存」をクリック → API が `PATCH /admin/superadmin/system-config` を呼び出す

---

## 組織管理

### 組織の一覧・作成・編集・削除

superadmin 設定タブ → 「組織管理」セクションで操作できます。

| 操作 | API |
|------|-----|
| 一覧取得 | `GET /admin/superadmin/organizations` |
| 作成 | `POST /admin/superadmin/organizations` |
| 取得 | `GET /admin/superadmin/organizations/{id}` |
| 更新 | `PATCH /admin/superadmin/organizations/{id}` |
| 削除 | `DELETE /admin/superadmin/organizations/{id}` |

### 組織フィールド

| フィールド | 説明 |
|-----------|------|
| `name` | 表示名（例: "Acme Inc."） |
| `slug` | URL セーフな識別子（英数字・ハイフンのみ、一意） |
| `custom_domain` | subdomain モード用のカスタムドメイン（省略可） |
| `plan` | 課金プラン（`free` / `pro` / `enterprise`） |
| `is_active` | 無効化フラグ（`false` にするとテナント解決で 404 になる） |
| `external_id` | NeNe Records 連携用の外部 ID（省略可） |

### external_id の意味（NeNe Records 連携）

`external_id` は将来の NeNe Records 統合検索で使用します。NeNe Records 側の `organization_id` をここに保存しておくことで、NeNe Corpus のコーパス検索結果と NeNe Records の API 検索結果をマージするときに組織の突き合わせが可能になります（ADR 0005 参照）。

---

## アーキテクチャ概要

```
リクエスト
  ↓
OrgResolverMiddleware
  ├─ bypass パス（/admin/auth/*, /admin/superadmin/*, /health, /install）→ org 解決スキップ
  └─ その他のパス
       ├─ system_config を読む（モード + スラッグ/ドメイン）
       ├─ organizations テーブルを参照してIDを解決
       └─ RequestScopedOrgIdHolder に organization_id を注入
            ↓
           Handler → UseCase → Pdo*Repository
                                  └─ WHERE organization_id = :org_id が自動付加
```

### RequestScopedOrgIdHolder

`RequestScopedOrgIdHolder` はリクエストスコープの DI コンテナにバインドされ、全 `Pdo*Repository` のコンストラクタに注入されます。

```php
// Repository 実装例（自動的に org_id フィルタが付加される）
$orgId = $this->orgIdHolder->getOrganizationId();
$stmt = $this->pdo->prepare(
    'SELECT * FROM sources WHERE organization_id = ? AND source_id = ?'
);
$stmt->execute([$orgId, $sourceId]);
```

**org filter を付けない SQL は設計上の重大不具合です**（絶対禁止パターン）。

---

## 注意事項

- superadmin ロールを持つ admin_user は `organization_id IS NULL` で登録されます（特定組織に属しません）。
- 組織を削除すると、その組織に属する全データ（sources / documents / chunks / chat_sessions 等）も連鎖削除されます。本番環境での削除操作は必ずバックアップを取ってから行ってください。
- subdomain / path モードは現時点では stub のみです。実装が完了するまでは `single` モードのみ使用してください。

---

## 関連ドキュメント

- ADR 0005: `docs/adr/0005-multi-tenancy-strategy.md`
- NeNe Records 境界: `docs/integrations/nene-records-client.md`
- OpenAPI: `docs/openapi/openapi.yaml`（`Superadmin` タグ参照）

---

## URL 構造（path router）

Admin SPA は起動時に `GET /admin/bootstrap`（public、auth/rate-limit ともに bypass）を fetch して `tenant_resolution_mode` と `tenant_org_slug` を取得し、これに基づいて URL を構築する。

### 構成要素

```
{install-base}/{org-slug?}/{route}
```

| 構成要素 | 例 | 説明 |
|---|---|---|
| `install-base` | `/admin` または `` | サブディレクトリ配置時のみ付く。`config.ts` の `resolveAdminApiBase()` が `pathname` を検査して自動検出 |
| `org-slug` | `acme` | **`tenant_resolution_mode === 'path'` の時のみ** URL に含まれる |
| `route` | `/dashboard` `/sources` `/settings` | アプリ内ルート |

### mode 別の URL 例

| mode | URL 例 | org 解決方法 |
|---|---|---|
| `single` | `/admin/dashboard` | system_config の固定 slug（`default`） |
| `subdomain` | `/admin/dashboard`（hostname は `acme.example.com`） | hostname のサブドメイン |
| `path` | `/admin/acme/dashboard` | URL の先頭セグメント（`acme`） |

### `GET /admin/bootstrap` レスポンス例

```json
// single モード（現在）
{ "tenant_resolution_mode": "single", "tenant_org_slug": "default" }

// path モード（subdomain/path Strategy 完成後）
{ "tenant_resolution_mode": "path", "tenant_org_slug": "acme" }
```

### SPA fallback (.htaccess)

path-based routing では、ブラウザの直叩き（`/admin/dashboard`）や再読み込みでも `index.html` が返る必要がある。`public_html/admin/.htaccess` と `frontend/apps/admin/public/.htaccess` の両方に SPA fallback を設定済み:

```apache
# Static files are served as-is.
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# SPA fallback — それ以外は index.html
RewriteCond %{REQUEST_URI} !^.*\.(?:js|css|map|png|jpg|jpeg|svg|ico|woff2?|ttf|json|xml|txt)$
RewriteRule . index.html [QSA,L]
```

詳細は ADR 0006（`docs/adr/0006-path-based-routing.md`）参照。
