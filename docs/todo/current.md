# Current Work

Last updated: 2026-07-18 (PR #349 / #350 / #353 系)

## E2E テストの実態（2026-07-18 実測 — 過去の「グリーン」記述より優先）

本ファイル下方の「157/157 グリーン」「200/200 グリーン」は**当時（2026-05 末）の記録**であり現状ではない。最新の実測（#348 / PR #350 で CLAUDE.md にも記録）:

| スイート | 実測結果 | 状態 |
| --- | --- | --- |
| widget（`tests/e2e/specs/` 103 テスト） | ✅ 103/103 pass（約1.1分） | 生きている |
| admin（`tests/e2e/admin/specs/` 373 テスト） | ❌ **226/373 pass・147 fail**（約58分） | spec が現行 admin UI と乖離（最新ビルドでも `01-auth` 3/17）。再整備 = **#351**、CI 配線 = **#352**（いずれも W4 編入・順序固定: #351 → #352） |

e2e は CI 未配線（merge ゲートではない）。実行方法は CLAUDE.md「E2E テスト」節を参照。

## 最近の docs 更新

- **ドキュメント正直化 2 本 + E2E 実測 (2026-07-18)** — CLAUDE.md の frontend check コメントを実態（lint + typecheck + test）へ（#347 / PR #349）。CLAUDE.md に E2E の実行手段と現状（CI 未配線・実測値）を記録（#348 / PR #350）。後続: admin spec 再整備 #351・CI 配線 #352（W4）・本ファイル正直化 #353。
- **W2a フリート波 (2026-07-14〜15)** — admin の Bearer 経路を `@hideyukimori/nene2-client` transport へ移行（#339 / PR #340）。eslint flat config 導入 + 公認差異 `corpus-widget-session-token` の override 実行可能登録（#341 / PR #342、base preset は W0b で別途）。X-Authorization フォールバック受け口を opt-in 有効化（#343 / PR #344）。vitest + msw のテスト基盤導入・api-client 両ヘッダ UT（#345 / PR #346）。
- **検品・NENE2 準拠波 (2026-06〜07)** — 本番 JWT secret 未設定時フェイルクローズ（#320 / PR #321）→ `GuardedJwtSecretResolver` へ寄せ（#322 / PR #323）。composer.lock の NENE2 pin 是正 + PDF 取り込み TX 化（#324 / PR #325）。検品C 先行セキュリティ 2 件（pagination clamp / `.env` 0640・escape、#328）。生 `time()`/`date()`・`gmdate()` を NENE2 `ClockInterface` 注入へ（#329 / PR #330、#333 / PR #334）。準拠リンタ conformance を check ゲートに配線（#331 / PR #332）。README 実態同期 + 統一テンプレ（#335〜#338）。ローカル開発ポート 89** 帯統一（#316 / PR #317）。favicon / ブランドアセット整備（#318 / PR #319）。
- **後処理 3 件 + Phase 5 着手 (2026-05-30)** — (1) Docker 全18マイグレーション適用・Tier A release ZIP 再ビルド（nene-corpus-4203d52.zip / 19MB）。(2) deep-link × .htaccess E2E テスト追加（#308 / PR #311、17-deep-link.spec.ts 9件）。(3) release ZIP シンボリックリンクバグ修正（#310 / PR #312、tools/build-release.sh）。(4) 実装済み OPEN Issue 21件クローズ（v2 リデザイン #261-#298・テナント #275-#280）、UpdateSource 後追い Issue #309 記録・クローズ。Phase 5 P1 開始: NeNe Records 読み取りクライアント（#313 / PR #315）。
- **v2 リデザイン仕上げ + マルチテナント main 統合 (PR #300 → #288)** — B-soft デザイン指示書に沿って Admin UI 全7画面（Login / Dashboard / Sources / Conversations / Settings / Analytics / Help）を仕上げ、旧パネルからの欠損機能8件（パスワード再設定・ソース編集モーダル・古いログ整理・Hero/アバター画像アップロード・ライブプレビュー・Analytics ページ + CSV エクスポート・アプリ内ヘルプ）を移植。レスポンシブ（hamburger ドロワー / tablet / mobile）、コンテンツ幅 1680px、認証ループ・ログアウト不具合の修正を含む。backend は **ソース編集 API（PUT /admin/sources/{id} + note カラム）** を追加。既存不具合（Analytics の MySQL 互換 SQL・CSV の PHP 8.4 deprecation・AdminHtaccess テスト）も修正。feat/298 → feat/tenancy-integration → main の順でマージし、マルチテナント一式と合わせて main に統合。重複サブ PR #281-285・Overview の #299 はクローズ。
- **マルチテナント Phase D (#280)** — OpenAPI に Superadmin tag + 7 endpoint + 5 schema 追加。ADR 0005（multi-tenancy strategy）新規作成。`docs/integrations/multi-tenancy.md` 設定ガイド追加。CLAUDE.md に Tenancy 規約セクション・禁止パターン追加。E2E spec `tests/e2e/admin/specs/16-tenancy.spec.ts` 7 テスト追加。`docs/todo/current.md` / `docs/roadmap.md` Phase 4 完了マーク更新。
- **会話分析ダッシュボード (#255 / PR #256)** — GET /admin/analytics/summary・top-questions・export の 3 エンドポイント追加。src/Analytics/ モジュール（14 ファイル）+ AnalyticsPanel.tsx + 6 ロケール対応。
- **ペルソナ UX シナリオテスト (#253)** — 20 業種 × 10 行動パターン = 200 ペルソナ E2E。全 7 チェックポイント完走。200/200 グリーン（231s）。主要知見: ソース取り込み CP3 が最大摩擦点（実行可能シナリオ 73% 失敗）。P1〜P3 改善提案付き UX 分析レポートを `docs/research/2026-05-28-persona-ux-analysis.md` に保存。
- **Admin E2E テストスイート拡充 (#250 #252)** — ギャップ分析で特定した漏れパターン 38 件を追加し 119 件→157 件に拡充。新規ファイル: `13-widget-chat.spec.ts`（12 件）・`14-notifications.spec.ts`（8 件）。157/157 グリーン（**当時**。2026-07-18 実測は 226/373 — 冒頭「E2E テストの実態」参照）。
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

**Phase 4 — Multi-tenancy: 完了（2026-05-29）**

| 項目 | 状態 |
| --- | --- |
| organizations / system_config テーブル・マイグレーション | ✅ |
| OrgResolverMiddleware + RequestScopedOrgIdHolder | ✅ |
| 全モジュール（Source/Document/Chunk/Chat/Session/Message/Settings/RateLimit/Analytics/AdminAuth）org スコープ適用 | ✅ |
| Admin UI Superadmin パネル（tenant resolution + org CRUD） | ✅ |
| OpenAPI Superadmin endpoints + schemas | ✅ |
| ADR 0005 + docs/integrations/multi-tenancy.md | ✅ |
| E2E spec 16-tenancy.spec.ts（7 件） | ✅ |

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
| P2 | **Admin UI フッター・ガイドリンク** | ✅ #217 — HelpPanel ガイドリンクカード・App フッター（NENE2/AYANE）・Vite proxy /guide |
| P2 | **ペルソナ HOWTO セットアップガイド** | ✅ #222 — /guide/howto/{locale}/、さくら（カフェオーナー）吹き出し×4ステップ + デモチャット、6ロケール |
| 🔴 | **ログインブルートフォース対策** | ✅ #224 (PR #225) — AdminLoginRateLimitMiddleware（IP 別 10 回/15 分、rate_limit_buckets 再利用） |
| 🔴 | **パスワードリセット** | ✅ #226 (PR #227) — メール経由リセットフロー（SHA-256 ハッシュ保存・列挙防止・1時間 TTL・使い捨てトークン） + Admin UI（忘れた場合リンク・リクエスト/確認フォーム）、6 ロケール |
| 🟡 | **Admin E2E テスト** | ✅ #250 (PR #251) — Playwright E2E 157 件（119→157、ギャップ補完 38 件・widget chat・notifications スペック追加）。⚠️ 2026-07-18 実測は 226/373 fail 込み — 再整備 #351（W4） |
| 🟡 | **ペルソナ UX シナリオテスト** | ✅ #253 — 200ペルソナ E2E（20業種×10行動パターン）、全7チェックポイント、200/200 pass (231s)、UX 分析レポート (`docs/research/2026-05-28-persona-ux-analysis.md`) |

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
curl -fsS http://localhost:8989/health
curl -fsS http://localhost:8989/openapi.php
```

NENE2 path dependency: see [`docs/development/docker.md`](../development/docker.md#path-dependency-nene2).
