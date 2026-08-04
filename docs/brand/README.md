# NeNe Corpus — ブランドアセット

ロゴ仕様書（mark 01「背表紙 / Spine」）に基づく正準ベクター一式と、そこから書き出した favicon の基準。

## マーク「背表紙 / Spine」

角丸スクエアに小文字 `n`、その下に横線（＝本の背表紙＝資料の集合 / コーパス）。

| 要素 | 値 |
| --- | --- |
| box | 正方形 46×46（基準単位）。角丸 `R = 11`（辺の約 24%） |
| n | JetBrains Mono **Bold** の小文字 n を光学中央に。font-size 22 / トラッキング -1。**アウトライン化済み**（フォント非依存の path） |
| spine | 横線 x13 y33 / w20 h2.4 / r1.2、不透明度 55%。n の下に水平配置 |

## 配色

| 用途 | box | n / spine | 備考 |
| --- | --- | --- | --- |
| primary（light） | `#3D5A8C` | `#FFFFFF` | 既定 |
| dark 反転 | `#8AA8D8` | `#14171C` | ダークモード |
| 1色（黒）mono | `#0F172A` | `#FFFFFF` | FAX・モノクロ印刷・捺印 |
| reversed | （箱なし） | `#FFFFFF` | 濃色背景・写真に重ねるとき |

## ファイル

### 正準ベクター（入稿基準・本ディレクトリ）

| ファイル | 用途 |
| --- | --- |
| `mark-light.svg` | primary（light） |
| `mark-dark.svg` | dark 反転 |
| `mark-mono.svg` | 1色（黒） |
| `mark-reversed.svg` | 反転（箱抜き） |
| `favicon.svg` | light 既定 + `prefers-color-scheme: dark` で自動反転 |

### 書き出し済み favicon（`frontend/public/`）

ビルド時に admin の配信ルート（dev は `/`、静的リリースは `public_html/admin/`）へコピーされ、`index.html` から参照される。

| ファイル | 用途 |
| --- | --- |
| `favicon.svg` | モダンブラウザ（ベクター・ダーク自動切替） |
| `favicon.ico` | レガシー（16/32/48 マルチサイズ） |
| `favicon-16.png` / `favicon-32.png` | PNG フォールバック |
| `apple-touch-icon.png` | iOS ホーム画面（180、navy 全面） |

## 再生成

JetBrains Mono Bold の `n` をアウトライン化してから書き出している（タブ表示・PNG ラスタライズでフォント依存にしないため）。フォントは [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono)（OFL）。マーク形状を変更する場合は、本ディレクトリの正準 SVG を真として favicon を再書き出しする。

## 最小サイズ・余白

- マーク単体は **16px** まで（背表紙の線が消えない下限）。ワードマーク併記時は箱を **20px** 以上に。
- 最小余白はマーク幅の **¼**。内側に他要素・文字・罫線を置かない。

## 使用上の注意

- 指定色のみ（グラデーション・別色置換は不可）。
- 歪めない・傾けない（縦横比変更・回転・せん断は不可）。
- 濃色の地には reversed 版（箱を抜き、白の n と線のみ）。

> アプリ内ロックアップ（Admin サイドバー / トップバー / ログイン）は `frontend/src/v2.css` の `.brand-mark` / `.auth-brand` で実装。
