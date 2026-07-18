# NeNe Corpus Widget — Browser E2E テストレポート

> **生成日:** 2026-05-27  
> **対象:** `frontend/apps/widget` — Embed Widget (widget.js)  
> **テストフレームワーク:** Playwright 1.60 / Chromium  
> **実行環境:** Python HTTP Server (port 3001)、API 全モック  
> **LLM:** Anthropic Messages API レスポンスパターンをすべてモック化（実 LLM 呼び出しなし）  
> **ブランチ:** `test/246-e2e-browser-tests`

---

## サマリー

| 指標 | 結果 |
|------|------|
| 総テスト数 | **68** |
| ✅ 合格 | **68** (100%) |
| ❌ 失敗 | 0 |
| ⏱ 実行時間 | 約 27 秒 |
| カバーカテゴリ | 10 カテゴリ |

---

## 発見・修正した既知バグ

テスト作成中に本番コードの不具合を 1 件発見・修正しました。

### ウィジェット JS の `process is not defined` エラー

- **症状:** `widget.js` (IIFE バンドル) に `process.env.NODE_ENV` 参照が残留。ブラウザには `process` グローバルが存在しないため、ウィジェットが起動しない。
- **原因:** Vite のライブラリモードビルドでは `process.env.NODE_ENV` の自動置換が行われない（通常ビルドと異なる挙動）。
- **修正:** `frontend/apps/widget/vite.config.ts` に `define: { 'process.env.NODE_ENV': JSON.stringify(mode) }` を追加。
- **効果:** バンドルサイズ 797 kB → **404 kB** (▲49% 削減)、開発版 React コードが完全に除去。

---

## カテゴリ別テスト結果

### 01. Widget Initialization（ウィジェット初期化）— 5 tests ✅

| ID | テスト内容 | 結果 |
|----|-----------|------|
| 01-01 | ページロード時にチャットパネルが表示される | ✅ |
| 01-02 | マウント時に自動でセッションを作成する | ✅ |
| 01-03 | セッション確立前は入力欄が無効化されている | ✅ |
| 01-04 | Appearance API 障害時はデフォルト外観でフォールバックする | ✅ |
| 01-05 | セッション作成失敗時はエラーメッセージを表示し入力欄を無効化する | ✅ |

**検証ポイント:**
- `widget.js` を `defer` 読み込みした HTML での自動初期化
- `POST /chat/sessions` の自動呼び出し
- セッション未確立状態でのフォームロック
- `GET /widget/appearance` の 500 エラー時グレースフルデグラデーション
- セッション失敗時の `.nene-corpus-chat__error` 表示

---

### 02. Message Input & Sending（メッセージ入力・送信）— 8 tests ✅

| ID | テスト内容 | 結果 |
|----|-----------|------|
| 02-01 | 空のメッセージを送信しても API を呼ばない | ✅ |
| 02-02 | 空白のみのメッセージは送信しない | ✅ |
| 02-03 | 通常メッセージが送信されチャットに表示される | ✅ |
| 02-04 | Enter キーで送信できる | ✅ |
| 02-05 | 送信後に入力欄がクリアされる | ✅ |
| 02-06 | 日本語テキストが正しく送信・表示される | ✅ |
| 02-07 | HTML 特殊文字がプレーンテキストとして安全に表示される | ✅ |
| 02-08 | 複数メッセージが履歴に蓄積される | ✅ |

**検証ポイント:**
- 空・空白のみ入力に対するサイレント no-op（API 不呼び出し）
- ボタンクリック・Enter キー両対応
- 送信後の入力欄リセット
- 日本語 Unicode テキストの送受信
- `<script>` タグ入力のエスケープ（XSS 防止）

---

### 03. LLM Response Patterns（LLM レスポンスパターン）— 14 tests ✅

Claude Messages API が返す全パターンをカバー。

| ID | stop_reason / パターン | 内容 | 結果 |
|----|----------------------|------|------|
| 03-01 | `end_turn` | 短文（1 文） | ✅ |
| 03-02 | `end_turn` | 中文（複数文） | ✅ |
| 03-03 | `end_turn` | 長文（複数段落）が完全に表示される | ✅ |
| 03-04 | `end_turn` | 超長文（1000 字超）ストレステスト | ✅ |
| 03-05 | `end_turn` | 1 単語の回答 | ✅ |
| 03-06 | fallback | コーパス情報なし（デフォルト文言） | ✅ |
| 03-07 | fallback | 事業者カスタムフォールバック文言 | ✅ |
| 03-08 | `max_tokens` | 文中で切断されたレスポンスをそのまま表示 | ✅ |
| 03-09 | `max_tokens` | 単語中で切断されたレスポンス | ✅ |
| 03-10 | Unicode | 日本語回答が文字化けなく表示 | ✅ |
| 03-11 | Unicode | 絵文字を含む回答が表示 | ✅ |
| 03-12 | Unicode | ダイアクリティカルマーク・アクセント付き文字 | ✅ |
| 03-13 | Security | HTML 特殊文字（`<>'"&`）がプレーンテキスト表示 | ✅ |
| 03-14 | Security | XSS ペイロードが実行されない | ✅ |

**検証ポイント:**
- Anthropic API の全 `stop_reason` 値: `end_turn`, `max_tokens`, フォールバック
- `max_tokens` 切断レスポンスの追記なし表示
- 多言語 Unicode の正確なレンダリング
- React の `{content}` 記法による XSS 自動エスケープ

---

### 04. Citation Display（引用表示）— 7 tests ✅

| ID | テスト内容 | 結果 |
|----|-----------|------|
| 04-01 | 引用なし — 引用セクション非表示 | ✅ |
| 04-02 | 1 件引用 — 抜粋テキスト表示 | ✅ |
| 04-03 | 複数引用（3 件）— 全件表示 | ✅ |
| 04-04 | ページ番号付き引用 — "p.N" 表示 | ✅ |
| 04-05 | ページ番号なし引用 — メタ非表示 | ✅ |
| 04-06 | 長抜粋テキスト — オーバーフローなく表示 | ✅ |
| 04-07 | 抜粋に HTML 特殊文字 — プレーンテキスト表示 | ✅ |

**検証ポイント:**
- 引用ゼロ時の `ul.nene-corpus-chat__citations` 非表示
- 複数引用の全件レンダリング
- `page_number` フィールドの条件付き表示
- 100 字超の長抜粋テキストのレンダリング耐性

---

### 05. Rate Limiting（レートリミット）— 7 tests ✅

バックエンドが返す全 429 パターンを網羅。

| ID | 制限種別 | 結果 |
|----|---------|------|
| 05-01 | セッション時間当たりリクエスト上限 | ✅ |
| 05-02 | メッセージ送信インターバル制限 | ✅ |
| 05-03 | IP 時間当たりリクエスト上限 | ✅ |
| 05-04 | IP 日次リクエスト上限 | ✅ |
| 05-05 | メッセージ長超過（文字数制限） | ✅ |
| 05-06 | トークン予算超過 | ✅ |
| 05-07 | 429 後の回復 — 次のメッセージは成功 | ✅ |

**検証ポイント:**
- 全 429 エラーで `.nene-corpus-chat__error` が表示される
- 各制限種別ごとに適切なエラーメッセージ内容
- エラー後に次のリクエストが成功した際のエラークリア

---

### 06. Error Handling（エラーハンドリング）— 7 tests ✅

| ID | テスト内容 | 結果 |
|----|-----------|------|
| 06-01 | 500 Internal Server Error — エラー表示 | ✅ |
| 06-02 | 500 LLM 空レスポンス（Claude refusal → バックエンド 500） | ✅ |
| 06-03 | 503 Service Unavailable — エラー表示 | ✅ |
| 06-04 | Anthropic 過負荷（529 → 503 変換）— エラー表示 | ✅ |
| 06-05 | ネットワーク中断（接続拒否）— エラー表示 | ✅ |
| 06-06 | 非 JSON レスポンス（HTML body）— エラー表示 | ✅ |
| 06-07 | 次の送信成功時にエラー状態がクリアされる | ✅ |

**検証ポイント:**
- サーバーエラー・LLM 障害・ネットワーク障害すべてで適切なエラーメッセージ
- 非 JSON ボディのパース失敗も捕捉
- エラー表示後の回復動作

---

### 07. UI States（UI 状態管理）— 5 tests ✅

| ID | テスト内容 | 結果 |
|----|-----------|------|
| 07-01 | レスポンス待ち中にタイピングドット（ペンディングバブル）が表示 | ✅ |
| 07-02 | リクエスト中は入力欄が無効化される | ✅ |
| 07-03 | リクエスト中は送信ボタンが無効化される | ✅ |
| 07-04 | 二重送信防止 — 複数クリックでも API 呼び出し 1 回のみ | ✅ |
| 07-05 | ユーザーメッセージがレスポンスより先に表示される（楽観的 UI） | ✅ |

**検証ポイント:**
- `.nene-corpus-chat__bubble--pending` と `.nene-corpus-chat__typing-dots` のライフサイクル
- リクエスト中のフォームロック・解除
- `isLoading` ガードによる二重送信防止（強制クリックでも 1 回）
- 楽観的 UI — `setTurns` が API 完了前に実行される

---

### 08. Hero Section（ヒーローセクション）— 5 tests ✅

| ID | テスト内容 | 結果 |
|----|-----------|------|
| 08-01 | メッセージ送信前にタイトル・説明が表示される | ✅ |
| 08-02 | 最初のメッセージ送信後にヒーローが非表示になる | ✅ |
| 08-03 | CTA ボタンクリックで入力欄がフォーカスされる | ✅ |
| 08-04 | ヒーローコンテンツ全無効時はヒーロー非表示 | ✅ |
| 08-05 | タイトル・説明なし・CTA のみの構成 | ✅ |

**検証ポイント:**
- Appearance API のヒーロー設定（`show_title`, `show_description`, `show_cta`）が正しく反映
- 初回メッセージ送信で `turns.length === 0` 条件が変わりヒーロー非表示
- CTA の `onCtaClick` → `inputRef.current?.focus()` 連携

---

### 09. Accessibility（アクセシビリティ）— 6 tests ✅

| ID | テスト内容 | 結果 |
|----|-----------|------|
| 09-01 | チャットパネルに `aria-label` あり | ✅ |
| 09-02 | メッセージコンテナに `aria-live="polite"` あり | ✅ |
| 09-03 | 入力欄に `aria-label` あり | ✅ |
| 09-04 | メッセージバブルの `aria-label`（ユーザー/アシスタントロール） | ✅ |
| 09-05 | キーボード操作 — Tab でフォーカス、Enter で送信 | ✅ |
| 09-06 | エラーメッセージが支援技術から見える（`aria-hidden` なし） | ✅ |

**検証ポイント:**
- WCAG 2.1 ライブリージョン（`aria-live="polite"`）によるスクリーンリーダー対応
- 全インタラクション要素の `aria-label`
- `article` 要素への `aria-label="User"` / `aria-label="Assistant"` 付与
- キーボードのみ操作でのメッセージ送信

---

### 10. Session Persistence（セッション永続化）— 4 tests ✅

| ID | テスト内容 | 結果 |
|----|-----------|------|
| 10-01 | セッション作成後 `sessionStorage` にトークンが保存される | ✅ |
| 10-02 | 既存トークンがある場合 — セッション API を再呼び出ししない | ✅ |
| 10-03 | `sessionStorage` クリア後 — 新規セッションが作成される | ✅ |
| 10-04 | メッセージ送信時に `X-Session-Token` ヘッダーが送信される | ✅ |

**検証ポイント:**
- `sessionStorage` キー `nene-corpus.session_token` の読み書き
- 既存トークンによるセッション API スキップ（ページリロード時）
- `page.addInitScript` によるストレージ事前シード
- HTTP ヘッダー `X-Session-Token` のキャプチャ検証

---

## テスト環境・アーキテクチャ

```
Playwright Chromium
    │
    │ page.route() — 全 API をモック
    │
    ├── GET  /widget/appearance  →  mockAppearance()
    ├── POST /chat/sessions      →  mockSession()
    └── POST /chat/messages      →  mockMessage() / mockMessageError() / mockMessageSequence()
    
    Python HTTP Server :3001
        └── public_html/widget-preview.html
            └── widget.js (production IIFE build)
```

### モックシナリオライブラリ（`fixtures/llm-scenarios.ts`）

| シナリオ | 内容 |
|---------|------|
| `SHORT_ANSWER` | 1 文短文回答 |
| `MEDIUM_ANSWER` | 複数文回答 |
| `LONG_ANSWER` | 複数段落の長文 |
| `VERY_LONG_ANSWER` | 1000 字超ストレステスト |
| `SINGLE_WORD_ANSWER` | 1 単語回答 |
| `FALLBACK_NO_INFO` | 情報なしフォールバック |
| `FALLBACK_CUSTOM` | カスタムフォールバック |
| `TRUNCATED_MID_SENTENCE` | `max_tokens` 切断（文中） |
| `TRUNCATED_MID_WORD` | `max_tokens` 切断（単語中） |
| `JAPANESE_ANSWER` | 日本語回答 |
| `EMOJI_ANSWER` | 絵文字含む回答 |
| `DIACRITIC_ANSWER` | アクセント文字含む回答 |
| `HTML_SPECIAL_CHARS` | HTML エンティティを含む回答 |
| `XSS_IN_CONTENT` | XSS ペイロードを含む回答 |
| `ANSWER_WITH_SINGLE_CITATION` | 1 件引用付き回答 |
| `ANSWER_WITH_MULTIPLE_CITATIONS` | 複数引用付き回答 |
| `ANSWER_WITH_PAGE_NUMBER` | ページ番号付き引用 |
| `ERROR_BODIES.*` | 全エラー種別 (429×6, 500×3, 503×2) |

---

## 品質指標

| 観点 | 確認内容 |
|-----|---------|
| **機能カバレッジ** | ウィジェットの全 UI 状態・API インタラクションをカバー |
| **セキュリティ** | XSS・HTML インジェクション防止を明示的に検証 |
| **アクセシビリティ** | WCAG 2.1 準拠: ARIA ライブリージョン・ラベル・キーボード操作 |
| **エラー耐性** | 全エラー種別（HTTP 4xx/5xx・ネットワーク中断・非 JSON）を網羅 |
| **国際化** | Unicode・日本語・絵文字・アクセント文字の正確なレンダリング |
| **セッション管理** | sessionStorage の読み書き・ヘッダー送信を HTTP レベルで検証 |
| **実行速度** | 68 テスト / **27 秒** (平均 0.4 秒/テスト) |

---

## テストファイル一覧

```
tests/e2e/
├── playwright.config.ts          # Chromium, port 3001, locale: en-US
├── fixtures/
│   ├── api-defaults.ts           # DEFAULT_APPEARANCE / SESSION / MESSAGE
│   ├── llm-scenarios.ts          # 全 LLM レスポンスパターン定義
│   └── helpers.ts                # mockAppearance / mockSession / gotoWidgetReady 等
└── specs/
    ├── 01-init.spec.ts           # 5 tests — 初期化
    ├── 02-messaging.spec.ts      # 8 tests — メッセージ送受信
    ├── 03-llm-responses.spec.ts  # 14 tests — LLM レスポンスパターン
    ├── 04-citations.spec.ts      # 7 tests — 引用表示
    ├── 05-rate-limits.spec.ts    # 7 tests — レートリミット
    ├── 06-errors.spec.ts         # 7 tests — エラーハンドリング
    ├── 07-ui-states.spec.ts      # 5 tests — UI 状態管理
    ├── 08-hero.spec.ts           # 5 tests — ヒーローセクション
    ├── 09-accessibility.spec.ts  # 6 tests — アクセシビリティ
    └── 10-session.spec.ts        # 4 tests — セッション永続化
```

---

*NeNe Corpus Widget E2E Test Suite — Issue #246*
