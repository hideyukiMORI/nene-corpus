#!/usr/bin/env node
/**
 * build-howto.mjs
 * ペルソナ駆動型セットアップ HOWTO を 6 か国語で生成して public_html/guide/howto/ に出力する。
 * ペルソナ: さくら（カフェオーナー）— 吹き出し + チャットデモでセットアップ 4 ステップを体験。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const OUT       = path.join(ROOT, 'public_html', 'guide', 'howto');
const GH_URL    = 'https://github.com/hideyukiMORI/nene-corpus';

// ブランドカラー（Admin / LP と合わせる）
const BRAND      = '#4d8f7f';
const BRAND_DARK = '#3a6e62';
const BRAND_LIGHT= '#e6f2ef';

const LOCALES = [
  { id: 'ja',      lang: 'ja',      label: '日本語',    googleFont: 'Noto+Sans+JP:wght@400;500;700;900',     fontFamily: '"Noto Sans JP", system-ui, sans-serif' },
  { id: 'en',      lang: 'en',      label: 'English',   googleFont: 'Inter:wght@400;500;600;700;800;900',    fontFamily: '"Inter", system-ui, sans-serif' },
  { id: 'de',      lang: 'de',      label: 'Deutsch',   googleFont: 'Inter:wght@400;500;600;700;800;900',    fontFamily: '"Inter", system-ui, sans-serif' },
  { id: 'fr',      lang: 'fr',      label: 'Français',  googleFont: 'Inter:wght@400;500;600;700;800;900',    fontFamily: '"Inter", system-ui, sans-serif' },
  { id: 'zh-hans', lang: 'zh-Hans', label: '中文',      googleFont: 'Noto+Sans+SC:wght@400;500;700;900',    fontFamily: '"Noto Sans SC", system-ui, sans-serif' },
  { id: 'pt-br',   lang: 'pt-BR',   label: 'Português', googleFont: 'Inter:wght@400;500;600;700;800;900',    fontFamily: '"Inter", system-ui, sans-serif' },
];

// ── ユーティリティ ─────────────────────────────────────────────────────────────

/**
 * バッククォート `...` → <code> タグ（中身をHTMLエスケープ）
 */
function renderText(str) {
  return String(str).replace(/`([^`]*)`/g, (_, code) => {
    const escaped = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<code class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-1.5 py-0.5 rounded text-[0.85em] font-mono">${escaped}</code>`;
  });
}

// ── ページ生成 ────────────────────────────────────────────────────────────────

function buildPage(locale, msgs, allLocales) {
  const t = (key) => renderText(msgs[key] ?? key);
  const raw = (key) => msgs[key] ?? key; // HTML エスケープなし（attributeで使う）

  // 言語プルダウンのメニューアイテム
  const langMenuItems = allLocales.map(({ id, label }) =>
    id === locale.id
      ? `<span class="flex items-center gap-2 px-4 py-2 text-sm font-semibold" style="color:${BRAND}">
           <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>${label}
         </span>`
      : `<a href="../${id}/" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
           <span class="w-3.5 h-3.5 shrink-0"></span>${label}
         </a>`
  ).join('');

  // ── セットアップステップ ──
  const steps = [1,2,3,4].map(n => {
    const items = [1,2,3,4].map(i => `
      <li class="flex items-start gap-2.5">
        <span class="flex-none w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5 shrink-0" style="background:${BRAND};opacity:.8">${i}</span>
        <span class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">${t(`step${n}.item${i}`)}</span>
      </li>`).join('');

    const embedCode = n === 4 ? `
      <div class="mt-5">
        <pre class="rounded-2xl bg-gray-900 text-green-300 text-xs p-5 overflow-x-auto leading-relaxed font-mono shadow-inner border border-gray-800"><code>&lt;script
  src="https://your-domain.com/widget.js"
  data-nene-corpus
&gt;&lt;/script&gt;</code></pre>
      </div>` : '';

    return `
      <div class="relative flex gap-6 pb-12 last:pb-0">
        <!-- 縦線（最後のステップ以外）-->
        ${n < 4 ? `<span class="absolute left-6 top-14 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700" aria-hidden="true"></span>` : ''}

        <!-- ステップ番号バッジ -->
        <div class="flex-none w-12 h-12 rounded-2xl text-white text-lg font-extrabold flex items-center justify-center shadow-lg shrink-0" style="background:${BRAND}">${n}</div>

        <!-- コンテンツ -->
        <div class="flex-1 min-w-0 pt-1">
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">${t(`step${n}.title`)}</h3>

          <!-- ペルソナ吹き出し -->
          <div class="relative mb-5 flex items-start gap-3">
            <div class="flex-none w-9 h-9 rounded-full text-white text-sm font-black flex items-center justify-center shadow-md shrink-0" style="background:${BRAND}">${raw('persona.avatar')}</div>
            <div class="relative flex-1 rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed text-white shadow-md" style="background:${BRAND}">
              <span class="absolute -left-2 top-3 w-3 h-3 rotate-45" style="background:${BRAND}"></span>
              ${t(`step${n}.persona.speech`)}
            </div>
          </div>

          <!-- 手順リスト -->
          <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 px-5 py-4">
            <ul class="space-y-3">
              ${items}
            </ul>
            ${embedCode}
          </div>
        </div>
      </div>`;
  }).join('');

  // ── デモチャット ──
  const demoChats = [1,2,3].map(n => `
    <!-- Q${n} -->
    <div class="flex flex-col gap-2">
      <!-- ユーザーバブル（右） -->
      <div class="flex justify-end">
        <div class="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white shadow-sm" style="background:${BRAND}">
          ${t(`demo.${n}.question`)}
        </div>
      </div>
      <!-- AI バブル（左）+ 引用バッジ -->
      <div class="flex items-end gap-2">
        <div class="flex-none w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 mb-0.5 shadow" style="background:${BRAND_DARK}">N</div>
        <div class="flex-1 min-w-0">
          <div class="inline-block rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 shadow-sm">
            ${t(`demo.${n}.answer`)}
          </div>
          <div class="mt-1.5 ml-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border" style="background:${BRAND_LIGHT};border-color:${BRAND}40;color:${BRAND}">
            <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            [${n}] ${t(`demo.${n}.citation`)}
          </div>
        </div>
      </div>
    </div>`).join('');

  // 改行を <br> に（hero title など）
  const heroTitle = t('hero.title').replace(/\n/g, '<br>');

  return `<!doctype html>
<html lang="${locale.lang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${raw('meta.title')}</title>
  <meta name="description" content="${raw('meta.description')}"/>
  <meta property="og:title" content="${raw('meta.title')}"/>
  <meta property="og:description" content="${raw('meta.description')}"/>
  <meta property="og:type" content="website"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=${locale.googleFont}&display=swap" rel="stylesheet"/>
  <!-- ダークモード初期化: flash を防ぐため CDN より先に実行 -->
  <script>
    (function(){
      var s = localStorage.getItem('guide-theme');
      if (s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
  <!-- Tailwind Play CDN v3: CDN を先に読み込み、その後 tailwind.config を設定する -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    /* Tailwind Play CDN v3: tailwind.config は CDN 読み込み後に設定する */
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: { DEFAULT:'${BRAND}', dark:'${BRAND_DARK}', light:'${BRAND_LIGHT}' },
          },
          fontFamily: {
            sans: [${locale.fontFamily.split(',').map(f => `'${f.trim().replace(/"/g,'')}'`).join(',')}],
          },
        },
      },
    };
  </script>
  <style>
    html { scroll-behavior:smooth; }
    body { font-family: ${locale.fontFamily}, sans-serif; }
    details summary::-webkit-details-marker { display:none; }
    pre code { font-family:'Menlo','Monaco','Consolas',monospace; }
    /* lang dropdown */
    #lang-menu { display:none; }
    #lang-menu.open { display:block; }
    /* デモチャット吹き出し装飾 */
    .chat-phone { background:white; border-radius:2rem; overflow:hidden; border:2px solid #e2e8f0; box-shadow:0 25px 60px -10px rgba(0,0,0,.18); }
    html.dark .chat-phone { background:#1e293b; border-color:#334155; }
    /* persona card */
    .persona-card { background:linear-gradient(135deg,${BRAND_LIGHT} 0%,${BRAND_LIGHT}80 100%); }
    html.dark .persona-card { background:linear-gradient(135deg,rgba(77,143,127,.18) 0%,rgba(77,143,127,.06) 100%); border-color:rgba(77,143,127,.35); }
  </style>
</head>
<body class="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-200">

  <!-- ── Nav ── -->
  <header class="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
      <!-- ロゴ -->
      <a href="../../${locale.id}/" class="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-base shrink-0 hover:opacity-80 transition-opacity">
        <span class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style="background:${BRAND}">N</span>
        NeNe Corpus
      </a>
      <!-- 戻るリンク -->
      <a href="../../${locale.id}/" class="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        ${t('nav.backToGuide')}
      </a>

      <div class="flex items-center gap-1.5 sm:gap-2 ml-auto">
        <!-- 言語プルダウン -->
        <div class="relative" id="lang-dropdown">
          <button onclick="toggleLangMenu(event)"
                  class="flex items-center gap-1 px-2.5 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
            <span class="hidden sm:inline font-medium">${allLocales.find(l=>l.id===locale.id).label}</span>
            <svg class="w-3 h-3 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <div id="lang-menu"
               class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 min-w-36 z-50">
            ${langMenuItems}
          </div>
        </div>

        <!-- ダークモードトグル -->
        <button onclick="toggleTheme()"
                class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode">
          <svg id="icon-moon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          <svg id="icon-sun" class="w-4 h-4 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </button>

        <!-- GitHub -->
        <a href="${GH_URL}" target="_blank" rel="noopener"
           class="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          GitHub
        </a>
      </div>
    </div>
  </header>

  <main>

    <!-- ── Hero ── -->
    <section class="pt-14 pb-12 sm:pt-20 sm:pb-16 bg-white dark:bg-gray-950">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <!-- テキスト -->
          <div>
            <span class="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full text-sm font-medium border"
                  style="color:${BRAND};border-color:${BRAND_LIGHT};background:${BRAND_LIGHT}">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              ${t('hero.badge')}
            </span>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 dark:text-white leading-[1.15] tracking-tight mb-5">
              ${heroTitle}
            </h1>
            <p class="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
              ${t('hero.subtitle')}
            </p>
            <a href="#steps"
               class="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-white text-base font-semibold shadow-lg transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5"
               style="background:${BRAND}">
              ${t('hero.cta')}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </a>
          </div>

          <!-- ペルソナカード -->
          <div class="flex justify-center lg:justify-end">
            <div class="persona-card border rounded-3xl p-8 max-w-xs w-full shadow-xl">
              <!-- アバター + 名前 -->
              <div class="flex items-center gap-4 mb-5">
                <div class="w-16 h-16 rounded-2xl text-white text-2xl font-black flex items-center justify-center shadow-lg" style="background:${BRAND}">
                  ${raw('persona.avatar')}
                </div>
                <div>
                  <p class="text-xl font-bold text-gray-900 dark:text-gray-100">${t('persona.name')}</p>
                  <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white" style="background:${BRAND}">${t('persona.role')}</span>
                </div>
              </div>
              <!-- 店名 -->
              <p class="text-sm font-medium mb-4" style="color:${BRAND}">📍 ${t('persona.shopName')}</p>
              <!-- 吹き出しイントロ -->
              <div class="relative rounded-2xl rounded-tl-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 shadow-sm">
                <span class="absolute -top-2.5 left-4 text-white text-base leading-none" style="text-shadow:0 1px 2px rgba(0,0,0,.1)">▾</span>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">${t('hero.persona.intro')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── セットアップステップ ── -->
    <section id="steps" class="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-14">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 dark:text-white mb-3">${t('steps.title')}</h2>
          <p class="text-gray-400 dark:text-gray-500 text-lg">${t('steps.subtitle')}</p>
        </div>
        <!-- タイムライン -->
        <div>
          ${steps}
        </div>
      </div>
    </section>

    <!-- ── デモチャット ── -->
    <section class="py-16 sm:py-24 bg-white dark:bg-gray-950">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 dark:text-white mb-3">${t('demo.title')}</h2>
          <p class="text-gray-400 dark:text-gray-500 text-lg max-w-xl mx-auto">${t('demo.subtitle')}</p>
        </div>

        <div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <!-- 説明テキスト -->
          <div class="space-y-5 order-2 lg:order-1">
            <div class="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <span class="text-2xl shrink-0">📄</span>
              <div>
                <p class="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">${{
                  ja:'アップロードしたファイルから答えます',
                  en:'Answers come from your uploaded files',
                  de:'Antworten stammen aus Ihren hochgeladenen Dateien',
                  fr:'Les réponses viennent de vos fichiers chargés',
                  'zh-hans':'回答来自您上传的文件',
                  'pt-br':'Respostas vêm dos seus arquivos carregados',
                }[locale.id]}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${{
                  ja:'メニュー・FAQ・店舗情報など、アップロードしたドキュメントの内容をもとに回答します。',
                  en:'Menu, FAQ, store info — whatever you upload becomes the AI\'s knowledge base.',
                  de:'Menü, FAQ, Storeinformationen — alles Hochgeladene wird zur Wissensbasis der KI.',
                  fr:'Menu, FAQ, infos boutique — tout ce que vous chargez devient la base de connaissances.',
                  'zh-hans':'菜单、FAQ、门店信息——上传的任何内容都成为 AI 的知识库。',
                  'pt-br':'Menu, FAQ, infos da loja — tudo que você envia vira a base de conhecimento da IA.',
                }[locale.id]}</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <span class="text-2xl shrink-0">🔖</span>
              <div>
                <p class="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">${{
                  ja:'出典が必ず付きます',
                  en:'Every answer includes citations',
                  de:'Jede Antwort enthält Quellen',
                  fr:'Chaque réponse inclut des citations',
                  'zh-hans':'每个回答都附带引用',
                  'pt-br':'Cada resposta inclui citações',
                }[locale.id]}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${{
                  ja:'どのドキュメントの何ページに書いてあるかを引用バッジで表示。信頼性を担保します。',
                  en:'Citation badges show exactly which document and page the answer comes from.',
                  de:'Zitatbadges zeigen genau, aus welchem Dokument und welcher Seite die Antwort stammt.',
                  fr:'Les badges de citation indiquent exactement de quel document et quelle page provient la réponse.',
                  'zh-hans':'引用徽章显示答案来自哪个文档和页面。',
                  'pt-br':'Badges de citação mostram exatamente de qual documento e página vem a resposta.',
                }[locale.id]}</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <span class="text-2xl shrink-0">⚡</span>
              <div>
                <p class="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">${{
                  ja:'24時間自動応答',
                  en:'24/7 automatic responses',
                  de:'24/7 automatische Antworten',
                  fr:'Réponses automatiques 24h/24',
                  'zh-hans':'全天候自动回复',
                  'pt-br':'Respostas automáticas 24h',
                }[locale.id]}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${{
                  ja:'訪問者がいつ来ても、設置したコンテンツから自動で回答します。',
                  en:'Visitors get instant answers any time of day, automatically from your content.',
                  de:'Besucher erhalten jederzeit sofortige Antworten aus Ihren Inhalten.',
                  fr:"Les visiteurs obtiennent des réponses instantanées à tout moment depuis votre contenu.",
                  'zh-hans':'无论访客何时到来，都能从您的内容中自动获得即时回答。',
                  'pt-br':'Visitantes recebem respostas instantâneas a qualquer hora do seu conteúdo.',
                }[locale.id]}</p>
              </div>
            </div>
          </div>

          <!-- デモチャット画面 -->
          <div class="order-1 lg:order-2 flex justify-center">
            <div class="chat-phone w-full max-w-sm">
              <!-- チャットヘッダー -->
              <div class="px-5 py-4 flex items-center gap-3" style="background:${BRAND}">
                <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-black">N</div>
                <div>
                  <p class="text-white font-bold text-sm">NeNe Corpus</p>
                  <p class="text-white/75 text-xs">${t('persona.shopName')}</p>
                </div>
              </div>
              <!-- チャットボディ -->
              <div class="px-4 py-5 space-y-5 bg-white dark:bg-gray-900 min-h-64">
                ${demoChats}
              </div>
              <!-- 入力欄 -->
              <div class="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <div class="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-400">…</div>
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style="background:${BRAND}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA ── -->
    <section class="py-20 sm:py-28 text-white" style="background:${BRAND}">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 leading-tight">${t('cta.title')}</h2>
        <p class="text-lg mb-8 opacity-85">${t('cta.subtitle')}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#steps"
             class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white font-semibold text-base transition-all hover:bg-gray-50 hover:-translate-y-0.5 shadow-xl"
             style="color:${BRAND}">
            ${t('cta.button')}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
          <a href="${GH_URL}" target="_blank" rel="noopener"
             class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base border border-white/30 hover:bg-white/10 transition-all">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
            GitHub
          </a>
        </div>
      </div>
    </section>

  </main>

  <!-- ── Footer ── -->
  <footer class="bg-gray-950 text-gray-400 py-12">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-sm">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-black" style="background:${BRAND}">N</span>
          <span class="text-white font-bold">NeNe Corpus</span>
        </div>
        <p class="text-gray-500">Powered by <a href="https://nene2.dev" target="_blank" rel="noopener" class="hover:text-gray-300 transition-colors">NENE2</a> · © <a href="https://ayane.co.jp" target="_blank" rel="noopener" class="hover:text-gray-300 transition-colors">AYANE</a> All rights reserved.</p>
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

  <script>
    // ── ダークモードトグル ──────────────────────────────────
    function toggleTheme() {
      var isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('guide-theme', isDark ? 'dark' : 'light');
      document.getElementById('icon-moon').classList.toggle('hidden', isDark);
      document.getElementById('icon-sun').classList.toggle('hidden', !isDark);
    }
    (function(){
      if (document.documentElement.classList.contains('dark')) {
        document.getElementById('icon-moon').classList.add('hidden');
        document.getElementById('icon-sun').classList.remove('hidden');
      }
    })();

    // ── 言語プルダウン ──────────────────────────────────────
    function toggleLangMenu(e) {
      e.stopPropagation();
      document.getElementById('lang-menu').classList.toggle('open');
    }
    document.addEventListener('click', function(e) {
      var dd = document.getElementById('lang-dropdown');
      if (dd && !dd.contains(e.target)) {
        document.getElementById('lang-menu').classList.remove('open');
      }
    });
  </script>
</body>
</html>`;
}

// ── index.html（言語自動検出）────────────────────────────────────────────────

function buildIndex() {
  return `<!doctype html><html><head><meta charset="UTF-8"/><title>NeNe Corpus — Setup Guide</title>
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
  console.log('✓ guide/howto/index.html');

  for (const locale of LOCALES) {
    const mod  = await import(`./howto-locales/${locale.id}.mjs`);
    const msgs = mod.default;
    const dir  = path.join(OUT, locale.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(locale, msgs, LOCALES), 'utf8');
    console.log(`✓ guide/howto/${locale.id}/index.html`);
  }

  console.log('\n✅ howto pages generated →', OUT);
}

main().catch(err => { console.error(err); process.exit(1); });
