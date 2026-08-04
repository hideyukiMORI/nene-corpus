#!/usr/bin/env node
// ビルドが web ルートを壊していないことの検査（#370・hub 通達4 の一般形・08-05）。
//
// 由来: #368 で単一ツリー化したとき、widget ビルド（outDir = public_html/・emptyOutDir: false）が
// admin SPA の `public/` を一緒にコピーし、**public_html/.htaccess を admin の SPA fallback 版で
// 上書きした**。API のフロントコントローラが死ぬ実害で、ビルドは成功したまま静かに起きる。
//
// 検査はバンドラ非依存の形にしてある（concierge #218 の実測形を hub が正とした）。
// vite でも esbuild でも「ビルド後に web ルートがどうなっているか」だけを見るので、
// 各艦が別のバンドラを使っていても同じ検査が成立する。
//
// 使い方: npm run verify:build （build / build:release の後段に組み込み済み）
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = resolve(projectRoot, 'public_html');
const failures = [];

/** 1) ビルド生成物が実際に置かれたか（検査自体が空振りしていないことの担保）。 */
for (const artifact of ['admin/index.html', 'widget.js', 'widget.css']) {
  const path = resolve(webRoot, artifact);

  if (!existsSync(path) || statSync(path).size === 0) {
    failures.push(`public_html/${artifact} が無いか空です（ビルドが出力していない）。`);
  }
}

/**
 * 2) web ルートの .htaccess が書き換わっていないか。
 *
 * これは API のフロントコントローラ用で、admin SPA 用（public_html/admin/.htaccess）とは
 * 別物。ダイジェストは git 追跡されている内容から毎回計算するのではなく、
 * 「フロントコントローラの証拠になる行が残っているか」で見る — 中身の正当な変更
 * （リライトルールの追加など）を無意味に赤くしないため。
 */
const rootHtaccess = resolve(webRoot, '.htaccess');

// 判定は両者の実物から取った差で行う。admin 版にも `index.php`（API を ../index.php へ
// 回す行）が出てくるので、その文字列の有無では**判別できない**（陽性対照で実証した）。
// 効く差は 2 つ: root は index.php への catch-all を持ち、SPA fallback（index.html）を持たない。
if (!existsSync(rootHtaccess)) {
  failures.push('public_html/.htaccess が消えています。');
} else {
  const content = readFileSync(rootHtaccess, 'utf8');

  if (!/RewriteRule\s+\^\s+index\.php/.test(content)) {
    failures.push(
      'public_html/.htaccess に index.php への catch-all がありません' +
        '（API のフロントコントローラが効かない）。',
    );
  }

  if (content.includes('index.html')) {
    failures.push(
      'public_html/.htaccess が SPA fallback（index.html）を含んでいます' +
        '（admin SPA 用の .htaccess で上書きされた疑い）。',
    );
  }
}

/**
 * 3) web ルート直下に見知らぬファイルが増えていないか。
 *
 * 実際に踏んだ壊れ方はこれ: admin の favicon 一式が public_html/ 直下へ散らばった。
 * 許可リストで囲っておけば、どのバンドラでも「静かに散らかった」ことを検出できる。
 */
const allowedRootEntries = new Set([
  // git 追跡されている web ルートの中身（`git ls-files public_html/` の第1階層）
  '.htaccess',
  'admin',
  'guide',
  'index.php',
  'install',
  'openapi.php',
  'widget-preview.html',
  // ビルド生成物（.gitignore 済み）
  'assets',
  'widget.css',
  'widget.js',
  // 実行時に作られるもの
  'media',
]);

const strays = readdirSync(webRoot).filter((entry) => !allowedRootEntries.has(entry));

if (strays.length > 0) {
  failures.push(
    `public_html/ 直下に見知らぬ生成物があります: ${strays.join(', ')}` +
      '\n    （widget ビルドの publicDir 設定を確認してください。意図した追加なら本スクリプトの許可リストへ）',
  );
}

if (failures.length > 0) {
  console.error('✗ ビルド出力の検査に失敗しました:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }

  process.exit(1);
}

console.log('✓ ビルド出力は健全（生成物あり・web ルートの .htaccess 不変・直下に散らかりなし）。');
