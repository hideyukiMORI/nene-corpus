# Current Work

Last updated: 2026-05-25

## 最近の docs 更新

- Phase 1 完了 — corpus ingestion milestone (#7–#15)
- Phase 2 完了 — chat sessions, chunk search, sync JSON, rate limiting
- Phase 3 進行 — frontend monorepo, widget, admin UI, appearance, i18n, admin デザイン (#33–#92)
- Phase 3+ バックログ追記 — オペレーター docs、テキスト取り込み、Widget UX 拡張（本ファイル）

## 状態サマリー

**Phase 1 — Corpus & Ingestion: 完了（2026-05-25）**

**Phase 2 — Chat & Citations: 完了（2026-05-25）**

**Phase 3 — Admin UI & Widget: 進行中（2026-05-25）**

| 項目 | 状態 |
| --- | --- |
| Frontend monorepo + widget + sync JSON chat | ✅ |
| Admin sources / ingestion / conversation logs | ✅ |
| Widget i18n + Appearance settings | ✅ |
| Admin i18n + locale fonts + light/dark theme | ✅ |
| **Tier A web installer + release ZIP** | 🔜 |
| **Shared-hosting operator docs（installer 連動）** | 🔜 |

`composer check` / `npm run check --prefix frontend` / GitHub Actions CI green。

---

## Phase 3 残り（Tier A）

| 優先 | 項目 | 説明 |
| --- | --- | --- |
| P0 | **Web installer** | DB・管理者・API キー初回設定（ブラウザ完結） |
| P0 | **Release ZIP** | vendor 同梱、FTP アップロード想定 |
| P1 | Shared-hosting docs 更新 | installer 手順と整合 |

Milestone: [`docs/milestones/2026-05-admin-ui-and-widget.md`](../milestones/2026-05-admin-ui-and-widget.md)

---

## Phase 3+ バックログ（合意済み・未着手）

Issue 化してから実装。優先は Tier A 完了後に再整理。

### オペレーター向けドキュメント

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | Admin 内 Help / Docs | 使い方・チュートリアル・FAQ。管理画面から辿れる |
| P2 | 公開説明書 | セットアップ後の運用ガイド（ ingest / embed / トラブルシュート） |

### コンテンツ取り込み・管理

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **テキスト直接入力** | CSV/PDF 以外 — メモ・FAQ 短文のペースト取り込み |
| P2 | **ドキュメント一覧・編集・削除** | 取り込み後の CRUD。テキスト入力とセットで検討 |
| P2 | チャンクプレビュー | 編集 UI の前段として有用 |

### Widget / チャット UX

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **HERO / ウェルカム** | チャット開始前のタイトル・説明文・CTA |
| P1 | **吹き出し UI** | アバター、user/assistant バブル、モダンなレイアウト |
| P2 | **ストリーミング表示** | 文字の逐次表示・スクロール挙動（SSE は Phase 2 P2 と連動） |
| P2 | **アバター登録** | Appearance または operator アップロード |
| P2 | **カスタム CSS** | WordPress 系向け。widget スコープ限定・サニタイズ必須 |

---

## Phase 2 残（任意）

| 優先 | 項目 | 説明 |
| --- | --- | --- |
| P2 | SSE streaming | Tier B 任意 — Widget ストリーミング UX とセットで検討 |

---

## 設計原則（再掲）

> **NeNe Records とは完全に分離。** 依存方向は `NeNe Corpus → NeNe Records API` のみ。
> 詳細: [`docs/adr/0002-separate-from-nene-records.md`](../adr/0002-separate-from-nene-records.md)

> **デュアルデプロイ:** Tier A = PHP 共用ホスティング + 1行 embed / Tier B = Docker・VPS。同一 API。
> 詳細: [`docs/adr/0003-dual-deployment-and-embed-widget.md`](../adr/0003-dual-deployment-and-embed-widget.md)

---

## Verification

```bash
composer check
npm run check --prefix frontend
docker compose up --build -d
curl -fsS http://localhost:8080/health
curl -fsS http://localhost:8080/openapi.php
```

NENE2 path dependency: see [`docs/development/docker.md`](../development/docker.md#path-dependency-nene2).
