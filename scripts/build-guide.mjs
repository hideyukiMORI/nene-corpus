#!/usr/bin/env node
/**
 * build-guide.mjs
 * チュートリアル LP を 6 か国語で生成して public_html/guide/ に出力する。
 * `npm run build:release --prefix frontend` から呼ばれる。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public_html', 'guide');

const LOCALES = [
  { id: 'ja',       lang: 'ja',    label: '日本語' },
  { id: 'en',       lang: 'en',    label: 'English' },
  { id: 'de',       lang: 'de',    label: 'Deutsch' },
  { id: 'fr',       lang: 'fr',    label: 'Français' },
  { id: 'zh-hans',  lang: 'zh-Hans', label: '中文' },
  { id: 'pt-br',    lang: 'pt-BR', label: 'Português' },
];

// ── HTML ページ生成 ──────────────────────────────────────────────────────────

function buildPage(locale, msgs, allLocales) {
  const t = (key) => msgs[key] ?? key;

  const langLinks = allLocales
    .map(({ id, label }) =>
      id === locale.id
        ? `<span class="font-semibold text-brand">${label}</span>`
        : `<a href="../${id}/" class="hover:text-brand transition-colors">${label}</a>`
    )
    .join('<span class="text-border mx-1">·</span>');

  const steps = (prefix, count) =>
    Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      return `
        <div class="flex gap-4">
          <div class="flex-none w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">${n}</div>
          <div>
            <h3 class="font-semibold text-fg mb-1">${t(`${prefix}.step${n}.title`)}</h3>
            <p class="text-muted text-sm leading-relaxed">${t(`${prefix}.step${n}.desc`)}</p>
            ${n === 4 && prefix === 'forAdmin' ? embedCode() : ''}
          </div>
        </div>`;
    }).join('\n');

  const embedCode = () => `
    <pre class="mt-3 rounded-lg bg-code text-code-fg text-xs p-3 overflow-x-auto leading-relaxed"><code>&lt;script
  src="https://your-domain.com/widget.js"
  data-nene-corpus
&gt;&lt;/script&gt;</code></pre>`;

  const faqs = Array.from({ length: 4 }, (_, i) => {
    const n = i + 1;
    return `
      <details class="group border border-border rounded-xl overflow-hidden">
        <summary class="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-medium text-fg select-none list-none hover:bg-surface-hover transition-colors">
          <span>${t(`faq.${n}.q`)}</span>
          <span class="text-muted text-xl leading-none transition-transform group-open:rotate-45 shrink-0">+</span>
        </summary>
        <div class="px-5 pb-4 pt-1 text-sm text-muted leading-relaxed border-t border-border">
          ${t(`faq.${n}.a`)}
        </div>
      </details>`;
  }).join('\n');

  const adminPagePath = '../../admin/';

  return `<!doctype html>
<html lang="${locale.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t('meta.title')}</title>
  <meta name="description" content="${t('meta.description')}" />
  <meta property="og:title" content="${t('meta.title')}" />
  <meta property="og:description" content="${t('meta.description')}" />
  <meta property="og:type" content="website" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand:   { DEFAULT: '#7c3aed', light: '#ede9fe' },
            fg:      { DEFAULT: '#111827' },
            muted:   { DEFAULT: '#6b7280' },
            border:  { DEFAULT: '#e5e7eb' },
            surface: { DEFAULT: '#ffffff', hover: '#f9fafb' },
            code:    { DEFAULT: '#1e1b4b', fg: '#c4b5fd' },
          },
        },
      },
    };
    // dark mode
    (function(){
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
  <style>
    @media (prefers-color-scheme: dark) {
      :root {
        --tw-text-opacity: 1;
      }
    }
    html.dark {
      --tw-bg-opacity: 1;
      background-color: rgb(17 24 39 / var(--tw-bg-opacity));
      color: rgb(243 244 246);
    }
    html.dark .text-fg   { color: #f3f4f6 !important; }
    html.dark .text-muted { color: #9ca3af !important; }
    html.dark .bg-surface { background: #111827 !important; }
    html.dark .bg-surface-hover { background: #1f2937 !important; }
    html.dark .border-border { border-color: #374151 !important; }
    html.dark .bg-white { background: #1f2937 !important; }
    html.dark .bg-gray-50 { background: #111827 !important; }
    html.dark .text-gray-900 { color: #f3f4f6 !important; }
    html.dark .text-gray-600 { color: #9ca3af !important; }
    html.dark .bg-code { background: #0f0c2e !important; }
    html.dark .text-border { color: #374151 !important; }
    html, body { scroll-behavior: smooth; }
  </style>
</head>
<body class="bg-white text-gray-900 antialiased">

  <!-- ── ヘッダー ── -->
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
      <a href="#" class="font-bold text-fg text-lg tracking-tight">${t('nav.home')}</a>
      <nav class="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted justify-end">
        ${langLinks}
      </nav>
    </div>
  </header>

  <main>

    <!-- ── Hero ── -->
    <section class="bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <span class="inline-block mb-5 px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
          ${t('hero.badge')}
        </span>
        <h1 class="text-3xl sm:text-5xl font-extrabold leading-tight mb-5 tracking-tight">
          ${t('hero.title')}
        </h1>
        <p class="text-base sm:text-lg text-violet-100 max-w-2xl mx-auto mb-8 leading-relaxed">
          ${t('hero.subtitle')}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#for-admin"
             class="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-violet-700 font-semibold hover:bg-violet-50 transition-colors text-sm">
            ${t('hero.cta')}
          </a>
          <a href="${adminPagePath}"
             class="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors text-sm border border-white/30">
            ${t('hero.ctaAdmin')}
          </a>
        </div>
      </div>
    </section>

    <!-- ── Features ── -->
    <section id="features" class="py-16 sm:py-20 bg-gray-50">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 class="text-2xl sm:text-3xl font-bold text-fg text-center mb-10">
          ${t('features.title')}
        </h2>
        <div class="grid sm:grid-cols-3 gap-6">
          ${[1,2,3].map(n => `
          <div class="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="text-3xl mb-3">${['📁','💬','🔗'][n-1]}</div>
            <h3 class="font-semibold text-fg mb-2">${t(`features.${n}.title`)}</h3>
            <p class="text-sm text-muted leading-relaxed">${t(`features.${n}.desc`)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ── For Admin ── -->
    <section id="for-admin" class="py-16 sm:py-20 bg-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <div class="max-w-2xl">
          <h2 class="text-2xl sm:text-3xl font-bold text-fg mb-2">${t('forAdmin.title')}</h2>
          <p class="text-muted mb-8">${t('forAdmin.subtitle')}</p>
          <div class="space-y-6">
            ${steps('forAdmin', 4)}
          </div>
        </div>
      </div>
    </section>

    <!-- ── For Users ── -->
    <section id="for-user" class="py-16 sm:py-20 bg-gray-50">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <div class="max-w-2xl">
          <h2 class="text-2xl sm:text-3xl font-bold text-fg mb-2">${t('forUser.title')}</h2>
          <p class="text-muted mb-8">${t('forUser.subtitle')}</p>
          <div class="space-y-6">
            ${steps('forUser', 3)}
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section id="faq" class="py-16 sm:py-20 bg-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 class="text-2xl sm:text-3xl font-bold text-fg text-center mb-10">${t('faq.title')}</h2>
        <div class="max-w-2xl mx-auto space-y-3">
          ${faqs}
        </div>
      </div>
    </section>

  </main>

  <!-- ── Footer ── -->
  <footer class="bg-gray-900 text-gray-400 py-10">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
      <div class="flex items-center gap-3">
        <span class="text-gray-200 font-semibold">${t('footer.poweredBy')}</span>
        <span class="text-gray-600">·</span>
        <span>${t('footer.copyright')} ${t('footer.rights')}</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="https://github.com/hideyukiMORI/nene-corpus"
           target="_blank" rel="noopener"
           class="hover:text-gray-200 transition-colors flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          ${t('footer.github')}
        </a>
        <span class="text-gray-600">·</span>
        <span>${t('footer.license')}</span>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

// ── language detection index.html ────────────────────────────────────────────

function buildIndex(locales) {
  const localeList = locales.map(l => `'${l.id}'`).join(', ');
  const lines = locales.map(({ id, lang }) => {
    const prefix = lang.split('-')[0].toLowerCase();
    const full = lang.toLowerCase();
    if (full === lang.toLowerCase() && full !== prefix) {
      return `  if (l === '${full}' || l.startsWith('${prefix}-')) locale = '${id}';`;
    }
    return `  if (l.startsWith('${prefix}')) locale = '${id}';`;
  });

  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>NeNe Corpus — Guide</title>
  <script>
    (function () {
      var locales = [${localeList}];
      var l = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      var locale = 'en';
      if (l.startsWith('ja')) locale = 'ja';
      else if (l.startsWith('de')) locale = 'de';
      else if (l.startsWith('fr')) locale = 'fr';
      else if (l.startsWith('zh')) locale = 'zh-hans';
      else if (l.startsWith('pt')) locale = 'pt-br';
      window.location.replace(locale + '/');
    })();
  </script>
</head>
<body></body>
</html>`;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // language detection entry
  fs.writeFileSync(path.join(OUT, 'index.html'), buildIndex(LOCALES), 'utf8');
  console.log('✓ guide/index.html');

  for (const locale of LOCALES) {
    const mod = await import(`./guide-locales/${locale.id}.mjs`);
    const msgs = mod.default;

    const dir = path.join(OUT, locale.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(locale, msgs, LOCALES), 'utf8');
    console.log(`✓ guide/${locale.id}/index.html`);
  }

  console.log('\n✅ guide pages generated →', OUT);
}

main().catch((err) => { console.error(err); process.exit(1); });
