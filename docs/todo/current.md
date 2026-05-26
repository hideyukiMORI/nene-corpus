# Current Work

Last updated: 2026-05-27 (PR #216)

## 最近の docs 更新

- Phase 1 完了 — corpus ingestion milestone (#7–#15)
- Phase 2 完了 — chat sessions, chunk search, sync JSON, rate limiting
- Phase 3 進行 — frontend monorepo, widget, admin UI, appearance, i18n, admin デザイン (#33–#92)
- Phase 3+ バックログ追記 — オペレーター docs、テキスト取り込み、Widget UX 拡張
- Tier A 完了 — web installer (#101)、release ZIP (#103)、shared-hosting docs (#105)
- **CLAUDE.md 拡充 (#157)** — Cursor ルール統合・現在状態・バックログ・アーキテクチャ規約を追記（Claude Code 単独起動対応）
- **Phase 3+ バックログ完了** — #160 #163 #165 #167 #169 をすべてマージ。未着手 Issue ゼロ。
- **Admin UI UX 改善 (session 4)** — #171 #173 #175 #177 #179 #181 をすべてマージ。
- **チャット利用制限 Phase A (#197 / PR #198)** — LLM 設定アコーディオン化 (#195)、ConversationLogsPanel Modal 化 (#193)、chat_limits_settings テーブル・ChatLimits モジュール・Admin UI（6 設定 + 4 プリセット）を実装。
- **チャット日次トークン制限 Phase B (#199 / PR #200)** — input/output トークン数の記録と日次トークン予算チェック（IP 別・グローバル）を実装。
- **Admin UI レイアウト・UX 改善 (#201 / PR #202)** — パネル順序整理（AI 設定→コンテンツ→運用監視→デザイン）、AppearancePanel を bordered box 化し max_width を Layout > サイズに隣接移動（Proximity / Miller / Fitts）、6 ロケール対応。
- **LLM 未設定アラート (#203 / PR #206)** — LlmUnconfiguredBanner コンポーネント追加、ログイン後に LLM 未設定時にアンバーアラート表示。
- **設定モーダル Phase 1 (#204 / PR #207)** — 全画面 `<dialog>` SettingsModal 新規作成、LLM・チャット設定・利用制限をモーダルへ統合、メイン画面をログ・データ管理に特化。
- **設定モーダル Phase 2 (#205 / PR #210)** — AppearancePanel を設定モーダルの「デザイン」タブへ移動、メイン画面をさらにスリム化（ログ・データ管理に特化）。

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
| P1 | Admin 内 Help / Docs | ✅ #117 + #149（LLM 設定・会話ログの節を追記） |
| P2 | 公開説明書 | ✅ #150 — [`docs/operations/operator-guide.md`](../operations/operator-guide.md) |

### コンテンツ取り込み・管理

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **テキスト直接入力** | ✅ #115 — 「テキスト入力」タブ + `POST /admin/sources` (`source_type: text`) |
| P2 | **ドキュメント一覧・編集・削除** | ✅ #153 — ソース配下のドキュメント CRUD + チャンク再生成 |
| P2 | チャンクプレビュー | ✅ #155 — ドキュメント選択時に検索チャンクを read-only 表示 |

**ドキュメント Admin UX（#153/#155 フォロー — Issue 化してから。次セッション以降）**

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P2 | **ソース表・一覧の折り返し** | ✅ #159 — `break-all min-w-0 max-w-xs` / `break-words` でソース名・ドキュメントタイトルの折り返し対応 |
| P2 | **ドキュメント一覧ページング** | ✅ #160 — PAGE_SIZE=50 / offset 制御 / prev・next ボタン |
| P2 | **ドキュメント検索（ソース内）** | ✅ #160 — タイトル LIKE 検索フォーム（AbortController パターン） |
| P2 | **編集 UI をモーダル/ドロワー化** | ✅ #167 — `<dialog>` モーダル化（backdrop/ESC 閉じ・一覧位置維持） |
| P2 | **overflow 全体対応** | ✅ #171 — 会話ログ・チャンクプレビュー・PDF プレビューに `break-words` 追加 |
| P2 | **vite alias 修正** | ✅ #173 — `@nene-corpus/api-client/chat-settings` alias 追加（build:release ENOTDIR 修正） |
| P2 | **編集モーダル中央寄せ** | ✅ #175 — `<dialog>` に `m-auto` を追加（Tailwind preflight リセット対応） |
| P2 | **ドキュメントパネルを全画面2カラムモーダル化** | ✅ #177 — アコーディオン廃止・`<dialog>` 2カラムレイアウト（リスト左・編集右） |
| P2 | **ページャ強化（件数・ページ指定）** | ✅ #179 — 件数セレクタ（25/50/100/200）・直接ページ番号入力追加 |
| P2 | **ページ入力 change/blur ジャンプ** | ✅ #181 — controlled input 化・スピナークリックでも即ジャンプ |

### Widget / チャット UX

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **HERO / ウェルカム** | ✅ #146 ほか — Appearance HERO 設定 |
| P1 | **吹き出し UI** | ✅ #133 — tail・レイアウト、`user_avatar_mode` |
| P2 | **CSS アニメーション UX** | ✅ #165 — prefers-reduced-motion 対応追加・scrollTo 改善（typing indicator・bubble-in・smooth scroll はすでに実装済みだった） |
| P2 | **アバター登録** | ✅ #134 — アシスタント画像アップロード |
| P2 | **カスタム CSS** | ✅ #169 — `custom_css` フィールド、禁止パターン検証、widget へ `<style>` 注入 |

### 会話ログ・監査

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P2 | **セッション metadata** | ✅ #129 |

### オペレーター設定

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **LLM API キー管理 UI** | ✅ #130 — マスク表示・接続テスト・`.env` 更新（ADR 0004） |
| P2 | **プロンプト / スコープ / フォールバック設定** | ✅ #163 — カスタムシステムプロンプト・フォールバックメッセージ UI（ChatSettingsPanel） |
| P2 | **LLM 設定アコーディオン化** | ✅ #195 — デフォルト閉・遅延ロード・nc-panel 統一 |
| P2 | **チャット利用制限 Phase A** | ✅ #197 — 文字数・インターバル・時間別/日次リクエスト制限 + Admin UI（4 プリセット） |
| P2 | **チャット日次トークン制限 Phase B** | ✅ #199 — input/output トークン記録・日次トークン予算（IP 別・グローバル） |
| P2 | **Admin UI レイアウト・UX 改善** | ✅ #201 — パネル順序・AppearancePanel bordered box 化・max_width 隣接配置 |
| P2 | **LLM 未設定アラート** | ✅ #203 — LlmUnconfiguredBanner（ログイン後 LLM 未設定時にアンバーアラート表示） |
| P2 | **設定モーダル Phase 1** | ✅ #204 — 全画面 SettingsModal（LLM・チャット設定・利用制限を統合、メイン画面スリム化） |
| P2 | **パスワード・メールアドレス変更** | ✅ #208 — AccountPanel（設定モーダル「アカウント」タブ）、PUT /admin/auth/password・/email |
| P2 | **設定モーダル Phase 2** | ✅ #205 — AppearancePanel を「デザイン」タブへ移動、メイン画面をログ・データ管理に特化 |
| P2 | **メール通知** | ✅ #211 — 利用制限超過アラート・日次チャットレポート（PHPMailer SMTP、cron エンドポイント、Admin UI 通知タブ、6ロケール） |
| P2 | **設定モーダル 概要ページ** | ✅ #213 — 初回表示を概要カードナビに変更（API キーが即露出しない） |
| P2 | **ガイド LP UI 改善** | ✅ #215 — ダークモード修正・ヘッダーナビ右寄せ・できることセクション再レイアウト・透明感カード・h2 折り返し修正 |

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
