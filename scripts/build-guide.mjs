#!/usr/bin/env node
/**
 * build-guide.mjs
 * チュートリアル LP を 6 か国語で生成して public_html/guide/ に出力する。
 * テーマ: stores.fun / thebase.com 風 — 白地・大型タイポ・ベントーグリッド・Sage Teal
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const OUT       = path.join(ROOT, 'public_html', 'guide');
const GH_URL    = 'https://github.com/hideyukiMORI/nene-corpus';

// ブランドカラー（Admin と合わせる）
const BRAND      = '#4d8f7f';
const BRAND_DARK = '#3a6e62';
const BRAND_LIGHT= '#e6f2ef';

const LOCALES = [
  { id: 'ja',      lang: 'ja',     label: '日本語',   googleFont: 'Noto+Sans+JP:wght@400;500;700;900',      fontFamily: '"Noto Sans JP", system-ui, sans-serif' },
  { id: 'en',      lang: 'en',     label: 'English',  googleFont: 'Inter:wght@400;500;600;700;800;900',     fontFamily: '"Inter", system-ui, sans-serif' },
  { id: 'de',      lang: 'de',     label: 'Deutsch',  googleFont: 'Inter:wght@400;500;600;700;800;900',     fontFamily: '"Inter", system-ui, sans-serif' },
  { id: 'fr',      lang: 'fr',     label: 'Français', googleFont: 'Inter:wght@400;500;600;700;800;900',     fontFamily: '"Inter", system-ui, sans-serif' },
  { id: 'zh-hans', lang: 'zh-Hans', label: '中文',    googleFont: 'Noto+Sans+SC:wght@400;500;700;900',     fontFamily: '"Noto Sans SC", system-ui, sans-serif' },
  { id: 'pt-br',   lang: 'pt-BR', label: 'Português', googleFont: 'Inter:wght@400;500;600;700;800;900',    fontFamily: '"Inter", system-ui, sans-serif' },
];

// ── SVG イラスト ────────────────────────────────────────────────────────────

const SVG = {
  // ドキュメント山積み + 虫眼鏡
  corpus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" aria-hidden="true">
    <rect x="30" y="54" width="88" height="108" rx="8" fill="${BRAND_LIGHT}" stroke="${BRAND}" stroke-width="2.5"/>
    <rect x="44" y="38" width="88" height="108" rx="8" fill="#f5fcfa" stroke="${BRAND}" stroke-width="2"/>
    <rect x="58" y="22" width="88" height="108" rx="8" fill="white" stroke="${BRAND}" stroke-width="2.5"/>
    <line x1="74" y1="46"  x2="128" y2="46"  stroke="${BRAND_LIGHT}" stroke-width="3" stroke-linecap="round"/>
    <line x1="74" y1="60"  x2="128" y2="60"  stroke="${BRAND_LIGHT}" stroke-width="3" stroke-linecap="round"/>
    <line x1="74" y1="74"  x2="110" y2="74"  stroke="${BRAND_LIGHT}" stroke-width="3" stroke-linecap="round"/>
    <line x1="74" y1="88"  x2="128" y2="88"  stroke="${BRAND_LIGHT}" stroke-width="3" stroke-linecap="round"/>
    <line x1="74" y1="102" x2="116" y2="102" stroke="${BRAND_LIGHT}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="148" cy="150" r="34" fill="${BRAND}" opacity="0.12"/>
    <circle cx="142" cy="144" r="20" fill="none" stroke="${BRAND}" stroke-width="3.5"/>
    <line x1="156" y1="158" x2="170" y2="172" stroke="${BRAND}" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  // チャットバブル + 引用バッジ
  chat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" aria-hidden="true">
    <rect x="14" y="22" width="128" height="64" rx="20" fill="${BRAND}"/>
    <path d="M34 86 L20 108 L54 86Z" fill="${BRAND}"/>
    <line x1="32" y1="46" x2="124" y2="46" stroke="white" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="32" y1="62" x2="98"  y2="62" stroke="white" stroke-width="3.5" stroke-linecap="round" opacity="0.75"/>
    <rect x="130" y="16" width="54" height="54" rx="27" fill="#f59e0b"/>
    <text x="157" y="50" text-anchor="middle" fill="white" font-size="22" font-weight="700" font-family="sans-serif">[1]</text>
    <rect x="68" y="116" width="120" height="58" rx="20" fill="#f1f5f4"/>
    <path d="M170 174 L186 196 L152 174Z" fill="#f1f5f4"/>
    <line x1="84"  y1="138" x2="172" y2="138" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    <line x1="84"  y1="154" x2="148" y2="154" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  </svg>`,

  // ブラウザ + ウィジェット
  embed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" aria-hidden="true">
    <rect x="10" y="18" width="180" height="138" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
    <rect x="10" y="18" width="180" height="36" rx="10" fill="#e2e8f0"/>
    <rect x="10" y="44" width="180" height="10" fill="#e2e8f0"/>
    <circle cx="32" cy="36" r="5" fill="#ef4444" opacity="0.6"/>
    <circle cx="50" cy="36" r="5" fill="#f59e0b" opacity="0.6"/>
    <circle cx="68" cy="36" r="5" fill="#22c55e" opacity="0.6"/>
    <line x1="28" y1="76"  x2="116" y2="76"  stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
    <line x1="28" y1="92"  x2="96"  y2="92"  stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
    <line x1="28" y1="108" x2="108" y2="108" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
    <line x1="28" y1="124" x2="80"  y2="124" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
    <rect x="116" y="72" width="68" height="82" rx="14" fill="${BRAND}"/>
    <line x1="128" y1="92"  x2="172" y2="92"  stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
    <line x1="128" y1="106" x2="162" y2="106" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
    <rect x="122" y="122" width="56" height="20" rx="6" fill="white" opacity="0.25"/>
    <circle cx="150" cy="66" r="14" fill="${BRAND}" stroke="white" stroke-width="2.5"/>
    <path d="M145 66 Q150 60 155 66 Q150 72 145 66Z" fill="white"/>
  </svg>`,

  // ウィジェットチャット画面（リアル感UP）
  widgetMockup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 500" fill="none" aria-hidden="true">
    <!-- 外枠 -->
    <rect width="320" height="500" rx="24" fill="white" stroke="#e2e8f0" stroke-width="2"/>
    <!-- ヘッダー -->
    <rect width="320" height="72" rx="24" fill="${BRAND}"/>
    <rect y="48" width="320" height="24" fill="${BRAND}"/>
    <circle cx="36" cy="36" r="18" fill="white" opacity="0.2"/>
    <circle cx="36" cy="36" r="12" fill="white" opacity="0.3"/>
    <text x="64" y="30" fill="white" font-size="15" font-weight="700" font-family="sans-serif">NeNe Corpus</text>
    <text x="64" y="48" fill="white" font-size="11" font-family="sans-serif" opacity="0.85">Knowledge Chat</text>
    <!-- アシスタントメッセージ 1 -->
    <rect x="16" y="88" width="210" height="72" rx="14" fill="#f1f5f4"/>
    <rect x="16" y="88" width="4" height="72" rx="2" fill="${BRAND}"/>
    <text x="30" y="110" fill="#334155" font-size="11" font-family="sans-serif">Based on the documentation,</text>
    <text x="30" y="126" fill="#334155" font-size="11" font-family="sans-serif">NeNe Corpus supports PDF,</text>
    <text x="30" y="142" fill="#334155" font-size="11" font-family="sans-serif">CSV, and plain text.</text>
    <!-- 引用バッジ -->
    <rect x="232" y="88" width="72" height="28" rx="14" fill="${BRAND_LIGHT}" stroke="${BRAND}" stroke-width="1.5"/>
    <text x="268" y="106" text-anchor="middle" fill="${BRAND}" font-size="11" font-weight="600" font-family="sans-serif">[1] p.3</text>
    <!-- ユーザーメッセージ -->
    <rect x="110" y="176" width="194" height="44" rx="14" fill="${BRAND}" opacity="0.12"/>
    <rect x="296" y="176" width="4" height="44" rx="2" fill="${BRAND}" opacity="0.6"/>
    <text x="120" y="196" fill="#1e3a34" font-size="11" font-family="sans-serif">Does it work on shared</text>
    <text x="120" y="212" fill="#1e3a34" font-size="11" font-family="sans-serif">hosting?</text>
    <!-- アシスタントメッセージ 2 -->
    <rect x="16" y="236" width="232" height="88" rx="14" fill="#f1f5f4"/>
    <rect x="16" y="236" width="4" height="88" rx="2" fill="${BRAND}"/>
    <text x="30" y="258" fill="#334155" font-size="11" font-family="sans-serif">Yes! You can install it on any</text>
    <text x="30" y="274" fill="#334155" font-size="11" font-family="sans-serif">shared host with PHP 8.2+</text>
    <text x="30" y="290" fill="#334155" font-size="11" font-family="sans-serif">and MySQL. FTP deploy,</text>
    <text x="30" y="306" fill="#334155" font-size="11" font-family="sans-serif">no SSH required.</text>
    <!-- 引用バッジ 2 -->
    <rect x="254" y="236" width="50" height="24" rx="12" fill="${BRAND_LIGHT}" stroke="${BRAND}" stroke-width="1.5"/>
    <text x="279" y="252" text-anchor="middle" fill="${BRAND}" font-size="10" font-weight="600" font-family="sans-serif">[2]</text>
    <!-- 区切り線 -->
    <line x1="16" y1="342" x2="304" y2="342" stroke="#e2e8f0" stroke-width="1"/>
    <!-- 入力欄 -->
    <rect x="12" y="354" width="256" height="44" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="24" y="380" fill="#94a3b8" font-size="11" font-family="sans-serif">Type your question…</text>
    <!-- 送信ボタン -->
    <rect x="276" y="354" width="44" height="44" rx="10" fill="${BRAND}"/>
    <path d="M288 376 L310 376 M304 370 L310 376 L304 382" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- 引用一覧 -->
    <rect x="12" y="406" width="296" height="82" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="22" y="424" fill="${BRAND}" font-size="10" font-weight="700" font-family="sans-serif">Sources</text>
    <text x="22" y="442" fill="#64748b" font-size="10" font-family="sans-serif">[1] Installation Guide — p.3</text>
    <text x="22" y="458" fill="#64748b" font-size="10" font-family="sans-serif">[2] Deployment Guide — p.7</text>
    <text x="22" y="474" fill="#64748b" font-size="10" font-family="sans-serif">[3] FAQ — p.12</text>
  </svg>`,

  // Hero 右: ブラウザ枠内にAdmin + Widgetが見える
  heroMockup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 380" fill="none" aria-hidden="true">
    <!-- ブラウザ外枠 -->
    <rect width="560" height="380" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
    <!-- ブラウザ toolbar -->
    <rect width="560" height="44" rx="16" fill="#f1f5f4"/>
    <rect y="30" width="560" height="14" fill="#f1f5f4"/>
    <circle cx="22" cy="22" r="5" fill="#ef4444" opacity="0.5"/>
    <circle cx="40" cy="22" r="5" fill="#f59e0b" opacity="0.5"/>
    <circle cx="58" cy="22" r="5" fill="#22c55e" opacity="0.5"/>
    <!-- URL バー -->
    <rect x="80" y="12" width="320" height="20" rx="6" fill="white" stroke="#e2e8f0" stroke-width="1"/>
    <text x="100" y="25" fill="#94a3b8" font-size="9" font-family="sans-serif">https://example.com/admin/</text>
    <!-- Admin サイドバー -->
    <rect x="0" y="44" width="148" height="336" fill="#fafafa" stroke="#e2e8f0" stroke-width="0.5"/>
    <!-- サイドバー ロゴ -->
    <rect x="12" y="58" width="80" height="14" rx="3" fill="${BRAND}" opacity="0.2"/>
    <rect x="12" y="58" width="20" height="14" rx="3" fill="${BRAND}" opacity="0.6"/>
    <!-- サイドバー メニュー -->
    <rect x="12" y="86"  width="124" height="26" rx="5" fill="${BRAND_LIGHT}"/>
    <rect x="12" y="118" width="124" height="22" rx="5" fill="transparent"/>
    <rect x="12" y="146" width="124" height="22" rx="5" fill="transparent"/>
    <rect x="12" y="174" width="124" height="22" rx="5" fill="transparent"/>
    <rect x="20" y="92"  width="6"  height="14" rx="2" fill="${BRAND}"/>
    <rect x="32" y="94"  width="60" height="10" rx="2" fill="${BRAND}" opacity="0.7"/>
    <rect x="20" y="124" width="6"  height="10" rx="2" fill="#94a3b8"/>
    <rect x="32" y="126" width="52" height="8"  rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="20" y="152" width="6"  height="10" rx="2" fill="#94a3b8"/>
    <rect x="32" y="154" width="56" height="8"  rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="20" y="180" width="6"  height="10" rx="2" fill="#94a3b8"/>
    <rect x="32" y="182" width="44" height="8"  rx="2" fill="#94a3b8" opacity="0.5"/>
    <!-- メインコンテンツ -->
    <rect x="148" y="44" width="412" height="336" fill="white"/>
    <!-- ヘッダー -->
    <rect x="148" y="44" width="412" height="40" fill="white" stroke="#f1f5f4" stroke-width="1"/>
    <rect x="164" y="58" width="80" height="12" rx="3" fill="#1e293b" opacity="0.1"/>
    <rect x="476" y="56" width="68" height="16" rx="6" fill="${BRAND}"/>
    <text x="510" y="68" text-anchor="middle" fill="white" font-size="8" font-weight="600" font-family="sans-serif">+ ソース追加</text>
    <!-- ソース一覧テーブル -->
    <rect x="160" y="98" width="388" height="28" rx="4" fill="#f8fafc"/>
    <rect x="172" y="106" width="50" height="10" rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="260" y="106" width="80" height="10" rx="2" fill="#94a3b8" opacity="0.5"/>
    <rect x="440" y="106" width="40" height="10" rx="2" fill="#94a3b8" opacity="0.5"/>
    <!-- 行 1 -->
    <rect x="160" y="128" width="388" height="36" rx="4" fill="white" stroke="#f1f5f4" stroke-width="1"/>
    <rect x="172" y="140" width="70" height="10" rx="2" fill="#1e293b" opacity="0.7"/>
    <rect x="260" y="142" width="90" height="8" rx="2" fill="#64748b" opacity="0.4"/>
    <rect x="430" y="138" width="48" height="12" rx="6" fill="${BRAND_LIGHT}"/>
    <text x="454" y="147" text-anchor="middle" fill="${BRAND}" font-size="7" font-weight="600" font-family="sans-serif">完了</text>
    <!-- 行 2 -->
    <rect x="160" y="166" width="388" height="36" rx="4" fill="white" stroke="#f1f5f4" stroke-width="1"/>
    <rect x="172" y="178" width="96" height="10" rx="2" fill="#1e293b" opacity="0.7"/>
    <rect x="260" y="180" width="72" height="8" rx="2" fill="#64748b" opacity="0.4"/>
    <rect x="430" y="176" width="48" height="12" rx="6" fill="${BRAND_LIGHT}"/>
    <text x="454" y="185" text-anchor="middle" fill="${BRAND}" font-size="7" font-weight="600" font-family="sans-serif">完了</text>
    <!-- 行 3 (処理中) -->
    <rect x="160" y="204" width="388" height="36" rx="4" fill="#fff9f0" stroke="#fef3c7" stroke-width="1"/>
    <rect x="172" y="216" width="60" height="10" rx="2" fill="#1e293b" opacity="0.7"/>
    <rect x="260" y="218" width="80" height="8" rx="2" fill="#64748b" opacity="0.4"/>
    <rect x="430" y="214" width="52" height="12" rx="6" fill="#fef3c7"/>
    <text x="456" y="223" text-anchor="middle" fill="#92400e" font-size="7" font-weight="600" font-family="sans-serif">処理中…</text>
    <!-- 統計カード -->
    <rect x="160" y="252" width="116" height="64" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="172" y="272" fill="#64748b" font-size="8" font-family="sans-serif">ソース数</text>
    <text x="172" y="298" fill="#1e293b" font-size="22" font-weight="700" font-family="sans-serif">3</text>
    <rect x="284" y="252" width="116" height="64" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="296" y="272" fill="#64748b" font-size="8" font-family="sans-serif">チャンク数</text>
    <text x="296" y="298" fill="#1e293b" font-size="22" font-weight="700" font-family="sans-serif">847</text>
    <rect x="408" y="252" width="140" height="64" rx="8" fill="${BRAND_LIGHT}" stroke="${BRAND}" stroke-width="1"/>
    <text x="420" y="272" fill="${BRAND_DARK}" font-size="8" font-family="sans-serif">今日のチャット</text>
    <text x="420" y="298" fill="${BRAND}" font-size="22" font-weight="700" font-family="sans-serif">24</text>
    <!-- ウィジェット（右下に浮いてる） -->
    <rect x="388" y="300" width="156" height="72" rx="14" fill="${BRAND}" opacity="0.97"/>
    <rect x="388" y="300" width="156" height="24" rx="14" fill="${BRAND}"/>
    <rect x="388" y="314" width="156" height="10" fill="${BRAND}"/>
    <text x="400" y="316" fill="white" font-size="9" font-weight="600" font-family="sans-serif">NeNe Corpus Chat</text>
    <rect x="396" y="328" width="96" height="12" rx="4" fill="white" opacity="0.15"/>
    <rect x="500" y="328" width="36" height="12" rx="4" fill="white"/>
    <text x="518" y="337" text-anchor="middle" fill="${BRAND}" font-size="7" font-weight="600" font-family="sans-serif">送信</text>
    <rect x="396" y="346" width="140" height="18" rx="6" fill="${BRAND_LIGHT}" opacity="0.3"/>
    <text x="404" y="358" fill="white" font-size="8" font-family="sans-serif" opacity="0.8">[1] マニュアル p.3  [2] FAQ p.7</text>
  </svg>`,
};

// ── 免責事項（言語別）────────────────────────────────────────────────────────
// ※ 長文のため require 相当で分離できるが、ここでは inline で管理する

const DISCLAIMER = {
  ja: `<div class="space-y-6 text-sm text-gray-600 leading-relaxed">
  <p class="text-base font-medium text-gray-900">本ページをお読みになる前に、以下の免責事項および利用規約（以下「本規約」）をご確認ください。本ソフトウェアを利用した場合、本規約に同意したものとみなします。</p>
  <section><h3 class="font-semibold text-gray-900 mb-2">1. ソフトウェアの無保証（MIT ライセンス条項）</h3><p>本ソフトウェア「NeNe Corpus」（以下「本ソフトウェア」）は <strong>MIT ライセンス</strong> のもとで提供されるオープンソースソフトウェアです。本ソフトウェアは <strong>「現状有姿（AS IS）」</strong> で提供され、明示的または黙示的な一切の保証を行いません。商品性・特定目的への適合性・権利不侵害の保証を含む、あらゆる明示的・黙示的保証を明示的に否認します。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">2. 責任の制限</h3><p>著作権者および貢献者は、本ソフトウェアの使用または使用不能に起因するいかなる直接的・間接的・偶発的・特別・懲罰的・結果的損害（代替品またはサービスの調達コスト、利用機会の喪失、データの喪失または破損、利益の喪失、業務の中断などを含むがこれに限らない）に対しても、損害発生の可能性を事前に告知されていた場合であっても、一切責任を負いません。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">3. AI による回答の正確性に関する免責</h3><p>本ソフトウェアのチャット機能は大規模言語モデル（LLM）による自動生成回答を返します。AI が生成する回答は事実誤認・不完全情報・古い情報を含む可能性があります（いわゆる「ハルシネーション」）。本ソフトウェアの回答を、<strong>医療・法律・財務・投資・安全保障その他の専門的意思決定の根拠</strong>として単独で使用しないでください。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">4. 第三者サービス（Anthropic Claude API）への依存</h3><p>本ソフトウェアは Anthropic, Inc. が提供する Claude API を使用します。Anthropic サービスの可用性・応答速度・価格改定・モデル品質の変動、および Anthropic 利用規約変更による制限について、本ソフトウェアの著作権者は一切責任を負いません。Claude API の利用には Anthropic の <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">利用ポリシー</a> および <a href="https://www.anthropic.com/legal/consumer-terms" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">利用規約</a> が別途適用されます。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">5. データの取り扱いと個人情報保護</h3><p>本ソフトウェアはセルフホスト型であり、コーパスデータおよびチャット履歴は <strong>オペレーターのサーバー上の MySQL データベース</strong> に保存されます。ただし、チャットの問い合わせ内容は AI 推論のため Anthropic の API サーバーに送信されます。オペレーターは、個人情報の保護に関する法律（個人情報保護法）・EU 一般データ保護規則（GDPR）等の適用されるデータ保護法令への準拠、エンドユーザーへのプライバシーポリシーの提示・同意取得、チャットログの適切な保管・管理・削除対応の義務を単独で負います。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">6. オペレーターの責任</h3><p>本ソフトウェアを設置・運用するオペレーターは以下に対して単独で責任を負います：エンドユーザーに対する利用規約・プライバシーポリシーの整備と周知 / 特定商取引法・景品表示法・不正競争防止法等の適用法令の遵守 / Anthropic API の利用料金（従量課金）の負担 / セキュリティインシデント（不正アクセス・情報漏洩等）への対応 / ウィジェットに表示するコンテンツの適法性・著作権侵害の不存在の確保 / 未成年者保護等の措置。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">7. 禁止事項</h3><p>本ソフトウェアを以下の目的または用途に使用することを厳に禁じます：違法なコンテンツの生成・配布・助長 / 詐欺・なりすまし・フィッシング・マルウェア配布 / 差別・ヘイトスピーチ・ハラスメントを助長するコンテンツの生成 / 他者の知的財産権・プライバシー権・名誉を侵害する行為 / Anthropic 利用ポリシーが禁止するあらゆる行為 / 日本法またはオペレーターが所在する国・地域の法令に違反する行為。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">8. 商標・帰属表示</h3><p>「Claude」および関連ロゴは Anthropic, Inc. の商標または登録商標です。「NENE2」は本ソフトウェアが依存する内部フレームワークの名称です。本ソフトウェアは Anthropic とは独立したプロジェクトであり、Anthropic による推薦・保証・承認を受けていません。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">9. 本規約の変更</h3><p>本免責事項および利用規約は予告なく変更される場合があります。最新版は <a href="${GH_URL}" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">GitHub リポジトリ</a> でご確認ください。継続的な利用をもって最新版の規約への同意とみなします。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">10. 準拠法・管轄</h3><p>本規約の解釈および適用は日本法に準拠します。本ソフトウェアの利用に起因する紛争については当事者間で誠実に協議するものとし、協議によって解決しない場合は適切な管轄裁判所に持ち込むものとします。なお、利用者は個別の法域の強行法規の適用を受ける場合があります。</p></section>
</div>`,

  en: `<div class="space-y-6 text-sm text-gray-600 leading-relaxed">
  <p class="text-base font-medium text-gray-900">Please read this Disclaimer and Terms of Use ("Terms") before using the software. By using NeNe Corpus, you agree to be bound by these Terms.</p>
  <section><h3 class="font-semibold text-gray-900 mb-2">1. No Warranty (MIT License)</h3><p>NeNe Corpus ("the Software") is open source software provided under the <strong>MIT License</strong>. THE SOFTWARE IS PROVIDED <strong>"AS IS"</strong>, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">2. Limitation of Liability</h3><p>To the maximum extent permitted by applicable law, in no event shall the copyright holders or contributors be liable for any direct, indirect, incidental, special, exemplary, or consequential damages (including, but not limited to, procurement of substitute goods or services; loss of use, data, or profits; or business interruption) however caused, even if advised of the possibility of such damage.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">3. Accuracy of AI-Generated Responses</h3><p>The chat feature returns responses generated automatically by a large language model (LLM). AI-generated responses may contain factual errors, incomplete information, or outdated content ("hallucinations"). <strong>Do not rely solely on the Software's responses for medical, legal, financial, investment, safety, or other professional decisions.</strong> Always verify critical information against primary sources.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">4. Third-Party Service Dependency (Anthropic Claude API)</h3><p>This Software relies on the Claude API provided by Anthropic, Inc. The copyright holders are not responsible for Anthropic service availability, pricing changes, model quality changes, or policy restrictions. Use of the Claude API is separately subject to Anthropic's <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">Usage Policy</a> and <a href="https://www.anthropic.com/legal/consumer-terms" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">Terms of Service</a>.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">5. Data Handling and Privacy</h3><p>This Software is self-hosted. Corpus data and chat history are stored in the <strong>Operator's own MySQL database</strong>. Chat query content is transmitted to Anthropic's API servers for AI inference. Operators are solely responsible for compliance with applicable data protection laws (GDPR, CCPA, etc.), providing a Privacy Policy to end users, and appropriate management of chat logs.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">6. Operator Responsibilities</h3><p>The Operator is solely responsible for: establishing Terms of Use and Privacy Policy for end users / compliance with all applicable laws in the Operator's jurisdiction / payment of Anthropic API usage fees / responding to security incidents / ensuring the legality of content displayed via the widget / any required age verification or child protection measures.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">7. Prohibited Uses</h3><p>Use of this Software for the following is strictly prohibited: generating or distributing illegal content / fraud, impersonation, phishing, or malware / content promoting discrimination, hate speech, or harassment / infringing intellectual property, privacy, or reputational rights of others / any activity prohibited by Anthropic's Usage Policy / any violation of applicable laws.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">8. Trademarks and Attribution</h3><p>"Claude" and related logos are trademarks or registered trademarks of Anthropic, Inc. "NENE2" refers to the internal framework upon which this Software depends. This Software is an independent project and is not endorsed, sponsored, or affiliated with Anthropic.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">9. Changes to These Terms</h3><p>These Terms may be updated without prior notice. The latest version is available in the <a href="${GH_URL}" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">GitHub repository</a>. Continued use constitutes acceptance of the updated Terms.</p></section>
</div>`,

  de: `<div class="space-y-6 text-sm text-gray-600 leading-relaxed">
  <p class="text-base font-medium text-gray-900">Bitte lesen Sie diesen Haftungsausschluss und diese Nutzungsbedingungen, bevor Sie die Software verwenden.</p>
  <section><h3 class="font-semibold text-gray-900 mb-2">1. Keine Gewährleistung (MIT-Lizenz)</h3><p>NeNe Corpus wird unter der <strong>MIT-Lizenz</strong> bereitgestellt. DIE SOFTWARE WIRD <strong>„WIE BESEHEN"</strong> OHNE JEGLICHE AUSDRÜCKLICHE ODER STILLSCHWEIGENDE GEWÄHRLEISTUNG BEREITGESTELLT.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">2. Haftungsbeschränkung</h3><p>In keinem Fall haften die Urheberrechtsinhaber für direkte, indirekte, zufällige, besondere oder Folgeschäden, die sich aus der Nutzung dieser Software ergeben.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">3. Genauigkeit KI-generierter Antworten</h3><p>KI-Antworten können Fehler enthalten. <strong>Verwenden Sie sie nicht als alleinige Grundlage für medizinische, rechtliche oder finanzielle Entscheidungen.</strong></p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">4. Abhängigkeit von Drittanbieterdiensten</h3><p>Diese Software nutzt die Claude API von Anthropic, Inc. Die Urheberrechtsinhaber haften nicht für Verfügbarkeit oder Preisänderungen. Die Nutzung unterliegt Anthropics <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">Nutzungsrichtlinie</a>.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">5. Datenverarbeitung &amp; Datenschutz</h3><p>Corpus-Daten werden lokal gespeichert. Chat-Anfragen werden an Anthropic übertragen. Der Betreiber ist allein verantwortlich für DSGVO-Konformität und Datenschutz.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">6–9. Betreiberpflichten, Verbote, Marken, Änderungen</h3><p>Der Betreiber trägt die alleinige Verantwortung für Rechtmäßigkeit, API-Kosten und Sicherheit. Illegale Nutzung ist verboten. „Claude" ist eine Marke von Anthropic. Aktuelle Bedingungen im <a href="${GH_URL}" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">GitHub-Repository</a>.</p></section>
</div>`,

  fr: `<div class="space-y-6 text-sm text-gray-600 leading-relaxed">
  <p class="text-base font-medium text-gray-900">Veuillez lire cet avertissement avant d'utiliser le logiciel. En l'utilisant, vous acceptez ces conditions.</p>
  <section><h3 class="font-semibold text-gray-900 mb-2">1. Absence de garantie (Licence MIT)</h3><p>NeNe Corpus est fourni sous <strong>licence MIT</strong>. LE LOGICIEL EST FOURNI <strong>« EN L'ÉTAT »</strong>, SANS GARANTIE D'AUCUNE SORTE.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">2. Limitation de responsabilité</h3><p>Les auteurs ne sauraient être tenus responsables de tout dommage résultant de l'utilisation de ce logiciel.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">3. Exactitude des réponses IA</h3><p>Les réponses peuvent contenir des erreurs. <strong>Ne les utilisez pas comme seule base pour des décisions médicales, juridiques ou financières.</strong></p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">4. Services tiers (API Claude)</h3><p>Ce logiciel utilise l'API Claude d'Anthropic. Son utilisation est soumise à la <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">politique d'utilisation</a> d'Anthropic.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">5–9. Données, responsabilités, interdictions, marques, modifications</h3><p>L'opérateur est seul responsable de la conformité RGPD, des frais API et de la sécurité. L'utilisation illégale est interdite. « Claude » est une marque d'Anthropic. Dernière version dans le <a href="${GH_URL}" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">dépôt GitHub</a>.</p></section>
</div>`,

  'zh-hans': `<div class="space-y-6 text-sm text-gray-600 leading-relaxed">
  <p class="text-base font-medium text-gray-900">在使用本软件之前，请阅读本免责声明。使用 NeNe Corpus 即表示您同意本条款。</p>
  <section><h3 class="font-semibold text-gray-900 mb-2">1. 无保证声明（MIT 许可证）</h3><p>NeNe Corpus 根据 <strong>MIT 许可证</strong>提供。本软件<strong>按"原样"</strong>提供，不提供任何明示或暗示的保证。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">2. 责任限制</h3><p>版权持有人不对因使用本软件而产生的任何直接、间接或后果性损害承担责任。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">3. AI 生成回答的准确性</h3><p>AI 回答可能包含错误。<strong>请勿将其单独用作医疗、法律或财务决策的依据。</strong></p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">4. 第三方服务依赖（Anthropic Claude API）</h3><p>本软件使用 Anthropic 的 Claude API。使用须遵守 Anthropic 的<a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">使用政策</a>。</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">5–9. 数据处理、运营者责任、禁止用途、商标、条款变更</h3><p>运营者单独负责 GDPR/个人信息保护合规、API 费用及安全事件。严禁非法用途。"Claude"是 Anthropic 的商标。最新条款请查阅<a href="${GH_URL}" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">GitHub 仓库</a>。</p></section>
</div>`,

  'pt-br': `<div class="space-y-6 text-sm text-gray-600 leading-relaxed">
  <p class="text-base font-medium text-gray-900">Leia este Aviso Legal antes de usar o software. Ao usá-lo, você concorda com estes Termos.</p>
  <section><h3 class="font-semibold text-gray-900 mb-2">1. Sem Garantia (Licença MIT)</h3><p>NeNe Corpus é fornecido sob a <strong>Licença MIT</strong>. O SOFTWARE É FORNECIDO <strong>"NO ESTADO EM QUE SE ENCONTRA"</strong>, SEM GARANTIA DE QUALQUER TIPO.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">2. Limitação de Responsabilidade</h3><p>Os detentores dos direitos autorais não serão responsáveis por quaisquer danos resultantes do uso deste software.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">3. Precisão das Respostas de IA</h3><p>As respostas podem conter erros. <strong>Não as use como base única para decisões médicas, jurídicas ou financeiras.</strong></p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">4. Dependência de Serviços de Terceiros</h3><p>Este Software usa a API Claude da Anthropic. O uso está sujeito à <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">Política de Uso</a> da Anthropic.</p></section>
  <section><h3 class="font-semibold text-gray-900 mb-2">5–9. Dados, Responsabilidades, Proibições, Marcas, Alterações</h3><p>O Operador é exclusivamente responsável pela conformidade com LGPD, custos de API e segurança. Uso ilegal é proibido. "Claude" é marca da Anthropic. Versão atual no <a href="${GH_URL}" target="_blank" rel="noopener" class="underline" style="color:${BRAND}">repositório GitHub</a>.</p></section>
</div>`,
};

// ── HTML ページ生成 ──────────────────────────────────────────────────────────

/**
 * ロケール文字列をHTMLに安全に変換する
 * - バッククォート `...` → <code> タグ（中身をHTMLエスケープ）
 * - <script> 等の生タグがブラウザに誤解釈されるのを防ぐ
 */
function renderText(str) {
  return String(str).replace(/`([^`]*)`/g, (_, code) => {
    const escaped = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<code class="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[0.85em] font-mono">${escaped}</code>`;
  });
}

function buildPage(locale, msgs, allLocales) {
  // t() はバッククォートを <code> に変換してHTMLエスケープ済みの文字列を返す
  const t = (key) => renderText(msgs[key] ?? key);

  const langLinks = allLocales
    .map(({ id, label }) =>
      id === locale.id
        ? `<span class="font-semibold" style="color:${BRAND}">${label}</span>`
        : `<a href="../${id}/" class="text-gray-500 hover:text-gray-900 transition-colors">${label}</a>`
    )
    .join('<span class="text-gray-300 mx-1.5 text-xs">|</span>');

  const trustBadges = [1,2,3,4].map(n => `
    <span class="inline-flex items-center gap-1.5 text-sm text-gray-500">
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="${BRAND}" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
      ${t(`trust.${n}`)}
    </span>`).join('');

  const howItWorksItems = Array.from({length:5},(_,i)=>{
    const n = i+1;
    const icons = ['📄','⚙️','💬','🔍','✅'];
    const bg = ['#f0faf8','#f0f7ff','#fff7ed','#f5f3ff','#f0fdf4'];
    return `
      <div class="flex flex-col items-center text-center group">
        <div class="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm transition-transform group-hover:-translate-y-1" style="background:${bg[i]}">
          ${icons[i]}
          <span class="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md" style="background:${BRAND}">${n}</span>
        </div>
        <h3 class="font-semibold text-gray-900 text-sm mb-1.5">${t(`howItWorks.step${n}.title`)}</h3>
        <p class="text-gray-500 text-xs leading-relaxed">${t(`howItWorks.step${n}.desc`)}</p>
      </div>`;
  });

  const arrowBetween = `<svg class="w-5 h-5 text-gray-300 self-start mt-5 hidden sm:block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`;

  const stepTimeline = (prefix, count) =>
    Array.from({length:count},(_,i)=>{
      const n = i+1;
      const last = n === count;
      return `
        <div class="relative flex gap-5${last ? '' : ' pb-10'}">
          ${last ? '' : `<span class="absolute left-5 top-11 bottom-0 border-l-2 border-dashed border-gray-200" aria-hidden="true"></span>`}
          <div class="flex-none w-10 h-10 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-md shrink-0" style="background:${BRAND}">${n}</div>
          <div class="pt-1.5 min-w-0">
            <h3 class="font-semibold text-gray-900 text-base mb-1.5">${t(`${prefix}.step${n}.title`)}</h3>
            <p class="text-gray-500 text-sm leading-relaxed">${t(`${prefix}.step${n}.desc`)}</p>
            ${prefix==='forAdmin'&&n===4 ? `
            <div class="mt-4">
              <p class="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">${t('forAdmin.embedCaption')}</p>
              <pre class="rounded-2xl bg-gray-900 text-green-300 text-xs p-5 overflow-x-auto leading-relaxed font-mono shadow-inner border border-gray-800"><code>&lt;script
  src="https://your-domain.com/widget.js"
  data-nene-corpus
&gt;&lt;/script&gt;</code></pre>
            </div>` : ''}
          </div>
        </div>`;
    }).join('');

  const faqItems = Array.from({length:6},(_,i)=>{
    const n = i+1;
    return `
      <details class="group border border-gray-100 rounded-2xl overflow-hidden bg-white hover:border-gray-200 transition-colors shadow-sm">
        <summary class="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer font-medium text-gray-900 select-none list-none hover:bg-gray-50 transition-colors">
          <span class="text-sm">${t(`faq.${n}.q`)}</span>
          <span class="text-2xl font-light text-gray-300 transition-transform duration-200 group-open:rotate-45 shrink-0">+</span>
        </summary>
        <div class="px-6 pb-5 pt-1 text-sm text-gray-500 leading-relaxed border-t border-gray-50">
          ${t(`faq.${n}.a`)}
        </div>
      </details>`;
  }).join('');

  return `<!doctype html>
<html lang="${locale.lang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${t('meta.title')}</title>
  <meta name="description" content="${t('meta.description')}"/>
  <meta property="og:title" content="${t('meta.title')}"/>
  <meta property="og:description" content="${t('meta.description')}"/>
  <meta property="og:type" content="website"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=${locale.googleFont}&display=swap" rel="stylesheet"/>
  <script>
    /* Tailwind Play CDN: config must be set BEFORE the CDN script loads */
    tailwind = { config: {
      theme: {
        extend: {
          colors: {
            brand: { DEFAULT:'${BRAND}', dark:'${BRAND_DARK}', light:'${BRAND_LIGHT}' },
          },
          fontFamily: {
            sans: [${locale.fontFamily.split(',').map(f => `'${f.trim().replace(/"/g,"")}'`).join(',')},'system-ui','sans-serif'],
          },
        },
      },
    }};
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    html { scroll-behavior:smooth; }
    body { font-family: ${locale.fontFamily}, sans-serif; }
    details summary::-webkit-details-marker { display:none; }
    pre code { font-family:'Menlo','Monaco','Consolas',monospace; }
    .bento-card { border-radius:1.5rem; overflow:hidden; border:1px solid #f1f5f9; background:white; transition:box-shadow .25s,transform .25s; }
    .bento-card:hover { box-shadow:0 8px 32px -4px rgba(0,0,0,.10); transform:translateY(-2px); }
  </style>
</head>
<body class="bg-white text-gray-900 antialiased">

  <!-- ── Nav ── -->
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <a href="#" class="flex items-center gap-2 font-bold text-gray-900 text-lg">
        <span class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style="background:${BRAND}">N</span>
        NeNe Corpus
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm text-gray-500">
        <a href="#for-admin" class="hover:text-gray-900 transition-colors">${t('nav.forAdmin')}</a>
        <a href="#for-user"  class="hover:text-gray-900 transition-colors">${t('nav.forUser')}</a>
        <a href="#faq"       class="hover:text-gray-900 transition-colors">${t('nav.faq')}</a>
        <a href="#disclaimer" class="hover:text-gray-900 transition-colors">${t('nav.disclaimer')}</a>
      </nav>
      <div class="flex items-center gap-2 sm:gap-3">
        <div class="hidden sm:flex items-center gap-x-2 text-xs">
          ${langLinks}
        </div>
        <a href="${GH_URL}" target="_blank" rel="noopener"
           class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          GitHub
        </a>
      </div>
    </div>
    <!-- モバイル言語切り替え -->
    <div class="sm:hidden flex items-center gap-x-2 text-xs px-4 pb-2">
      ${langLinks}
    </div>
  </header>

  <main>

    <!-- ── Hero ── -->
    <section class="pt-16 pb-12 sm:pt-24 sm:pb-16 bg-white overflow-hidden">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <!-- テキスト (hero is above the fold — no needed) -->
          <div>
            <span class="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-sm font-medium border"
                  style="color:${BRAND};border-color:${BRAND_LIGHT};background:${BRAND_LIGHT}">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              ${t('hero.badge')}
            </span>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 leading-[1.1] tracking-tight mb-6">
              ${t('hero.title')}
            </h1>
            <p class="text-lg sm:text-xl text-gray-500 leading-relaxed mb-8 max-w-lg">
              ${t('hero.subtitle')}
            </p>
            <div class="flex flex-col sm:flex-row gap-3 mb-10">
              <a href="#for-admin"
                 class="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-white text-base font-semibold shadow-lg transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5"
                 style="background:${BRAND}">
                ${t('hero.cta')}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
              <a href="../../admin/"
                 class="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-gray-700 text-base font-semibold bg-gray-100 hover:bg-gray-200 transition-all">
                ${t('hero.ctaAdmin')}
              </a>
            </div>
            <div class="flex flex-wrap gap-x-6 gap-y-3">
              ${trustBadges}
            </div>
          </div>
          <!-- 製品モックアップ (hero is above the fold — no needed) -->
          <div class="relative">
            <div class="absolute -inset-4 rounded-3xl opacity-20 blur-2xl" style="background:linear-gradient(135deg,${BRAND_LIGHT},${BRAND}30)"></div>
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
              ${SVG.heroMockup}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Stats strip ── -->
    <section class="py-10 border-y border-gray-100" style="background:#fafcfb">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          ${[
            { num: 'MIT',  label: 'License' },
            { num: '6',    label: 'Languages' },
            { num: 'PHP',  label: '8.2+ · MySQL' },
            { num: '0',    label: 'Cloud Lock-In' },
          ].map(({num,label})=>`
          <div>
            <div class="text-3xl sm:text-4xl font-extrabold mb-1" style="color:${BRAND}">${num}</div>
            <div class="text-sm text-gray-400 font-medium">${label}</div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ── Bento Features ── -->
    <section id="features" class="py-20 sm:py-28 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-14">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 mb-4">${t('features.title')}</h2>
          <p class="text-gray-400 text-lg max-w-xl mx-auto">${t('features.subtitle')}</p>
        </div>

        <!-- ベントーグリッド -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">

          <!-- 大カード: コーパス構築 (col-span-2 on lg) -->
          <div class="bento-card lg:col-span-2 p-8 flex flex-col sm:flex-row items-center gap-8"
               style="background:linear-gradient(135deg,white 60%,${BRAND_LIGHT}40)">
            <div class="shrink-0 w-44 h-44">${SVG.corpus}</div>
            <div>
              <span class="text-xs font-bold uppercase tracking-widest mb-3 block" style="color:${BRAND}">01</span>
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-3">${t('features.1.title')}</h3>
              <p class="text-gray-500 leading-relaxed">${t('features.1.desc')}</p>
            </div>
          </div>

          <!-- 縦カード: 引用チャット -->
          <div class="bento-card p-8 flex flex-col" style="background:${BRAND_LIGHT}60">
            <div class="w-32 h-32 mx-auto mb-4">${SVG.chat}</div>
            <span class="text-xs font-bold uppercase tracking-widest mb-2 block" style="color:${BRAND}">02</span>
            <h3 class="text-lg font-bold text-gray-900 mb-2">${t('features.2.title')}</h3>
            <p class="text-gray-500 text-sm leading-relaxed">${t('features.2.desc')}</p>
          </div>

          <!-- 縦カード: 1行埋め込み -->
          <div class="bento-card p-8 flex flex-col">
            <div class="w-32 h-32 mx-auto mb-4">${SVG.embed}</div>
            <span class="text-xs font-bold uppercase tracking-widest mb-2 block" style="color:${BRAND}">03</span>
            <h3 class="text-lg font-bold text-gray-900 mb-2">${t('features.3.title')}</h3>
            <p class="text-gray-500 text-sm leading-relaxed">${t('features.3.desc')}</p>
          </div>

          <!-- 横長カード: 追加特徴 2 列 -->
          <div class="bento-card sm:col-span-2 lg:col-span-2 p-8 grid sm:grid-cols-2 gap-8">
            <div>
              <div class="text-3xl mb-3">🌐</div>
              <h3 class="font-bold text-gray-900 mb-2">${t('trust.4')}</h3>
              <p class="text-gray-500 text-sm leading-relaxed">ja / en / de / fr / zh-Hans / pt-BR</p>
            </div>
            <div>
              <div class="text-3xl mb-3">🏠</div>
              <h3 class="font-bold text-gray-900 mb-2">${t('trust.1')}</h3>
              <p class="text-gray-500 text-sm leading-relaxed">${t('trust.2')} · ${t('trust.3')}</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ── How It Works ── -->
    <section id="how-it-works" class="py-20 sm:py-28" style="background:#fafcfb">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-14">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 mb-4">${t('howItWorks.title')}</h2>
          <p class="text-gray-400 text-lg max-w-xl mx-auto">${t('howItWorks.subtitle')}</p>
        </div>
        <div class="hidden sm:flex items-start justify-between gap-3">
          ${howItWorksItems.flatMap((s,i)=>i<4?[s,arrowBetween]:[s]).join('')}
        </div>
        <div class="sm:hidden space-y-8">
          ${howItWorksItems.join('')}
        </div>
      </div>
    </section>

    <!-- ── For Admin ── -->
    <section id="for-admin" class="py-20 sm:py-28 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest mb-3 block" style="color:${BRAND}">For Operators</span>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 mb-4">${t('forAdmin.title')}</h2>
            <p class="text-gray-400 mb-10 text-lg">${t('forAdmin.subtitle')}</p>
            ${stepTimeline('forAdmin', 4)}
          </div>
          <div class="hidden lg:block sticky top-24">
            <div class="rounded-3xl overflow-hidden shadow-xl border border-gray-100 p-8" style="background:${BRAND_LIGHT}30">
              <p class="text-xs font-bold uppercase tracking-widest mb-5 text-gray-400">Setup Checklist</p>
              <div class="space-y-3">
                ${[
                  { icon:'🔑', label:'Anthropic API Key',    done:true },
                  { icon:'📁', label:'Sources uploaded',      done:true },
                  { icon:'🤖', label:'AI model configured',   done:true },
                  { icon:'🌐', label:'Widget embedded',        done:false },
                ].map(({icon,label,done})=>`
                <div class="flex items-center gap-3 p-3.5 bg-white rounded-2xl shadow-sm border ${done?'border-brand/20':'border-gray-100'}">
                  <span class="text-xl">${icon}</span>
                  <span class="text-sm font-medium ${done?'text-gray-700':'text-gray-400'} flex-1">${label}</span>
                  ${done
                    ? `<svg class="w-5 h-5 shrink-0" fill="${BRAND}" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
                    : `<span class="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 shrink-0"></span>`}
                </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── For Users ── -->
    <section id="for-user" class="py-20 sm:py-28" style="background:#fafcfb">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div class="order-2 lg:order-1 flex justify-center">
            <div class="w-64 sm:w-72 drop-shadow-2xl">${SVG.widgetMockup}</div>
          </div>
          <div class="order-1 lg:order-2">
            <span class="text-xs font-bold uppercase tracking-widest mb-3 block" style="color:${BRAND}">For End Users</span>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 mb-4">${t('forUser.title')}</h2>
            <p class="text-gray-400 mb-10 text-lg">${t('forUser.subtitle')}</p>
            ${stepTimeline('forUser', 3)}
            <div class="mt-6 p-4 rounded-2xl border text-xs leading-relaxed"
                 style="background:#fffbeb;border-color:#fef3c7;color:#92400e">
              ${t('forUser.note')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section id="faq" class="py-20 sm:py-28 bg-white">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-10">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 mb-4">${t('faq.title')}</h2>
        </div>
        <div class="space-y-2.5">
          ${faqItems}
        </div>
      </div>
    </section>

    <!-- ── CTA ── -->
    <section class="py-20 sm:py-28 text-white" style="background:${BRAND}">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight">${t('hero.title')}</h2>
        <p class="text-lg mb-8 opacity-85">${t('hero.subtitle')}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#for-admin"
             class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white font-semibold text-base transition-all hover:bg-gray-50 hover:-translate-y-0.5 shadow-xl"
             style="color:${BRAND}">
            ${t('hero.cta')}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
          <a href="${GH_URL}" target="_blank" rel="noopener"
             class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base border border-white/30 hover:bg-white/10 transition-all">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
            ${t('footer.github')}
          </a>
        </div>
      </div>
    </section>

    <!-- ── Disclaimer ── -->
    <section id="disclaimer" class="py-12 sm:py-16 border-t border-gray-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <details class="group">
          <summary class="flex items-center gap-2 cursor-pointer list-none select-none mb-0 group-open:mb-6">
            <svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span class="text-xs font-medium text-gray-400 hover:text-gray-500 transition-colors">${t('disclaimer.title')}</span>
            <svg class="w-3.5 h-3.5 text-gray-300 transition-transform duration-200 group-open:rotate-180 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </summary>
          <div class="text-xs text-gray-400 leading-relaxed [&_h3]:font-semibold [&_h3]:text-gray-500 [&_h3]:mb-1 [&_h3]:mt-4 [&_strong]:font-semibold [&_a]:underline [&_a:hover]:text-gray-600 [&_section]:mt-3">
            ${DISCLAIMER[locale.id]}
          </div>
        </details>
      </div>
    </section>

  </main>

  <!-- ── Footer ── -->
  <footer class="bg-gray-950 text-gray-400 py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-sm">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-black" style="background:${BRAND}">N</span>
          <span class="text-white font-bold">NeNe Corpus</span>
        </div>
        <p class="text-gray-500">${t('footer.poweredBy')} · ${t('footer.copyright')} ${t('footer.rights')}</p>
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <a href="${GH_URL}" target="_blank" rel="noopener" class="flex items-center gap-1.5 hover:text-white transition-colors">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          ${t('footer.github')}
        </a>
        <span class="text-gray-700">·</span>
        <span>${t('footer.license')}</span>
        <span class="text-gray-700">·</span>
        <a href="#" class="hover:text-white transition-colors">${t('footer.backToTop')} ↑</a>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

// ── index.html（言語自動検出）────────────────────────────────────────────────

function buildIndex() {
  return `<!doctype html><html><head><meta charset="UTF-8"/><title>NeNe Corpus — Guide</title>
<script>(function(){var l=(navigator.language||'en').toLowerCase(),locale='en';
if(l.startsWith('ja'))locale='ja';else if(l.startsWith('de'))locale='de';
else if(l.startsWith('fr'))locale='fr';else if(l.startsWith('zh'))locale='zh-hans';
else if(l.startsWith('pt'))locale='pt-br';
window.location.replace(locale+'/');})();</script>
</head><body></body></html>`;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), buildIndex(), 'utf8');
  console.log('✓ guide/index.html');

  for (const locale of LOCALES) {
    const mod  = await import(`./guide-locales/${locale.id}.mjs`);
    const msgs = mod.default;
    const dir  = path.join(OUT, locale.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(locale, msgs, LOCALES), 'utf8');
    console.log(`✓ guide/${locale.id}/index.html`);
  }

  console.log('\n✅ guide pages generated →', OUT);
}

main().catch(err => { console.error(err); process.exit(1); });
