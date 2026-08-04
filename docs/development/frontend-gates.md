# Frontend Gates

`npm run check --prefix frontend` に組み込まれている機械ゲートの一覧と、赤くなったときの直し方。

すべて **`check` に集約**してある。`check` は CI の required チェックなので、ここに入ったものは自動的に「落ちたら merge がブロックされる」を満たす（別ジョブに分けると required 追加の依頼が要るうえ、「走るが止めない」状態が起きやすい）。

| ゲート | コマンド | 何を守るか |
| --- | --- | --- |
| ESLint | `npm run lint` | 規約 01/02 の実行可能部分（FSD 境界・transport 禁止・a11y・i18n・testing） |
| ベースラインのラチェット | `npm run lint:baseline` | 既存違反が**増えないこと**と、減ったときにベースラインが**下がること** |
| 型 | `npm run typecheck` | `tsc --noEmit` |
| テスト | `npm run test` | vitest |
| 依存の脆弱性 | `npm run audit` | `audit-ci`（high/critical・allowlist は advisory 単位） |
| ビルド出力 | `npm run verify:build` | ビルドが web ルートを壊していないこと（`build` / `build:release` の後段） |

---

## ベースライン方式（なぜ「全部赤」にしないか）

corpus は 2026-08-05（#370）に配布ルール本体を初めて有効化した。その時点で **3,588 件**の既存違反があった。全部を赤にすると誰も merge できないので、**現状を凍結して新規だけを赤にする**方式を採る（hub 裁定 Q5・フリート共通）。

凍結は 3 つのファイルに分かれている。**すべて減る方向にしか動かせない。**

| ファイル | 対象 | 初期値 |
| --- | --- | --- |
| `frontend/eslint-suppressions.json` | ESLint の **error**（ファイル×ルール単位） | 2,806 件 / 57 ファイル |
| `frontend/eslint-warning-baseline` | ESLint の **warning** の総数 | 781 |
| `frontend/knip-baseline` | knip の指摘総数（未使用ファイル・未使用 export） | 114 |

error は ESLint 自身の bulk suppressions で per-file / per-rule に凍結されるので、**新しい違反はそのまま赤になる**。warning と knip は抑制機構が無いので件数の上限で守る。

### 直し方

**新しい違反を出してしまった場合**（`check` が赤）: 違反を直す。ベースラインは上げられない。

```
✗ warning が増えました: 781 → 784（+3）。ベースラインは上げられません。
```

**既存違反を直した場合**（これも `check` が赤になる。良い変化だがベースラインの更新が要る）:

```bash
npm run lint:baseline -- --update    # 3 つのベースラインをまとめて更新
```

更新後のファイルを**コミットに含める**こと。下げ忘れると、減った分だけ将来の新規違反を無言で吸収してしまう。

`lint:baseline` は stale な suppressions（凍結されているのに実際は直っている違反）も検出する。`--update` で刈り取られる。

---

## ビルド出力の検査（`verify:build`）

`build` と `build:release` の後段で走る。**バンドラ非依存**の形にしてあるので、vite でも esbuild でも同じ検査が成立する。

見ているのは 3 点:

1. **生成物があるか** — `public_html/admin/index.html` / `widget.js` / `widget.css` が存在して空でない（検査自体が空振りしていないことの担保）
2. **web ルートの `.htaccess` が書き換わっていないか** — `index.php` への catch-all があり、SPA fallback（`index.html`）を含まないこと
3. **web ルート直下に見知らぬファイルが増えていないか** — 許可リストで囲う

### なぜこれがあるか

#368（単一ツリー化）で実際に踏んだ壊れ方を検出するためにある。widget ビルドは `outDir` が `public_html/`（`emptyOutDir: false`）の lib ビルドなので、`publicDir` を切らないと **admin SPA の `public/` を一緒にコピーし、`public_html/.htaccess` を admin の SPA fallback 版で上書きする**。API のフロントコントローラが死ぬ実害で、**ビルドは成功したまま静かに起きる**。

> 検査 2 の条件は陽性対照で決めた。最初は「`.htaccess` に `index.php` が含まれるか」で書いたが、**admin 版にも `index.php` が出てくる**（API を `../index.php` へ回す行）ため、わざと上書きしても検出できなかった。実物の差（catch-all の有無・SPA fallback の有無）に置き換えて通るようにした。**陽性対照を取らなければ、この検査は「あるのに効かない」まま出荷されていた。**

---

## 陽性対照（ゲートが生きていることの実証）

導入時に確認済み（#370）。ゲートを触ったら再確認すること。

| ゲート | わざと壊す方法 | 期待 |
| --- | --- | --- |
| ESLint | `src/` に `fetch()` 直呼びのファイルを置く | `no-restricted-globals`（A-1）で赤・exit 1 |
| ラチェット | 同上 | 「抑制されていない error が 1 件」で exit 1 |
| ビルド出力 | `public_html/.htaccess` を admin 版で上書き | catch-all 欠落 + SPA fallback 混入の 2 件で exit 1 |
| ビルド出力 | `public_html/` 直下に favicon を置く | 「見知らぬ生成物」で exit 1 |
| ビルド出力 | `public_html/.htaccess` を消す | 「消えています」で exit 1 |

---

## まだ配線していないもの

- **dependency-cruiser** — 規約 01 が `[C:depcruise]`（循環・孤児・unknown-layer）を強制タグとして挙げているが、**フリート 13 艦のどこにも配備されていない**（2026-08-05 実測）。generator と同じ「タグはあるが装置が配布されていない」状態なので、corpus だけで独自実装はしない。配布されたら wire する。孤児検出は当面 knip が代替する。
- **stylelint** — `03-styling` は phase 計画で baseline 凍結のみに降格されている。CSS 側のゲートはその波で入る。
