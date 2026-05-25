# Current Work

Last updated: 2026-05-25

## 最近の docs 更新

- Phase 1 完了 — corpus ingestion milestone (#7–#15)
- Phase 2 完了 — chat sessions, chunk search, sync JSON, rate limiting
- Phase 3 進行 — frontend monorepo, widget, admin UI, appearance, i18n, admin デザイン (#33–#92)
- Phase 3+ バックログ追記 — オペレーター docs、テキスト取り込み、Widget UX 拡張
- Tier A 完了 — web installer (#101)、release ZIP (#103)、shared-hosting docs (#105)

## 状態サマリー

**Phase 1 — Corpus & Ingestion: 完了（2026-05-25）**

**Phase 2 — Chat & Citations: 完了（2026-05-25）**

**Phase 3 — Admin UI & Widget: 完了（2026-05-25）**

| 項目 | 状態 |
| --- | --- |
| Frontend monorepo + widget + sync JSON chat | ✅ |
| Admin sources / ingestion / conversation logs | ✅ |
| Widget i18n + Appearance settings | ✅ |
| Admin i18n + locale fonts + light/dark theme | ✅ |
| **Tier A web installer + release ZIP** | ✅ installer / ✅ ZIP build |
| **Shared-hosting operator docs（installer 連動）** | ✅ |

`composer check` / `npm run check --prefix frontend` / GitHub Actions CI green。

---

## Phase 3 残り（Tier A）

Tier A コア（installer、release ZIP、operator docs）は完了。Phase 3 milestone クローズ後、Phase 3+ バックログを再整理。

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
| P1 | **吹き出し UI** | #133 — tail・レイアウト、`user_avatar_mode`（silhouette / none）、アシスタント表示 ON/OFF |
| P2 | **CSS アニメーション UX** | 応答待ちインジケータ、吹き出し fade/slide-in、スムーズスクロール。**文字の逐次表示は不要** |
| P2 | **アバター登録** | #134 — アシスタント画像アップロード（#133 後） |
| P2 | **カスタム CSS** | WordPress 系向け。widget スコープ限定・サニタイズ必須 |

### 会話ログ・監査

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P2 | **セッション metadata** | #129 — `client_ip`・`user_agent`（任意で referer / 埋め込みページ）。`POST /chat/sessions` 作成時に記録。管理画面は一覧＋詳細パネル。IP/UA は個人データ — 保持期間・記録オフを docs に明記 |

### オペレーター設定

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **LLM API キー管理 UI** | #130 — 現状は web installer 初回設定と `.env` 手編集のみ。有効期限切れ・別 Anthropic アカウントへの切替・キー更新を Admin から。マスク表示、保存前テスト、秘密情報は GET で返さない。Tier A は `.env` 更新 vs DB 暗号化の ADR 要 |
| P2 | **プロンプト / スコープ / フォールバック設定** | roadmap Phase 3 記載の operator 設定 UI。LLM 挙動の調整 |

**チャット transport:** **sync JSON chat** のみ。**SSE / token ストリーミングは非ゴール**（Tier A/B 共通）。

---

## 非ゴール（再確認）

| 項目 | 方針 |
| --- | --- |
| SSE streaming | 実装しない。FAQ 低頻度トラフィック向けに sync JSON + ローディング/CSS で十分 |

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
