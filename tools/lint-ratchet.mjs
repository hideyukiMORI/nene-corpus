#!/usr/bin/env node
// ESLint のベースラインを shrink-only に保つラチェット（#370・規約 05・hub 裁定 Q5）。
//
// corpus は 2026-08-05 に配布ルール本体を初めて有効化した時点で 3,588 件の既存違反があった。
// 全部を赤にすると誰も merge できないので凍結したが、凍結は「増やさない」だけでは足りない。
// 減ったときにベースラインを下げ忘れると、その分だけ将来の新規違反を無言で吸収してしまう。
// このスクリプトは両方向を機械で守る:
//
//   1. error   … eslint-suppressions.json で凍結済み。新規は eslint 自身が赤にする。
//                加えて「凍結したまま実際には直っている」stale エントリが無いことを検査する
//                （--prune-suppressions を作業コピーに当てて差分を見る）。
//   2. warning … 抑制機構が無いので件数の上限で守る。上限は eslint-warning-baseline。
//                超えたら失敗。下回ったら「ベースラインを下げろ」と言って失敗する。
//
// 使い方: npm run lint:baseline （npm run check に組み込み済み）
//         npm run lint:baseline -- --update  で両方のベースラインを更新する
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../frontend');
const warningBaselinePath = resolve(frontendRoot, 'eslint-warning-baseline');
const suppressionsPath = resolve(frontendRoot, 'eslint-suppressions.json');
const update = process.argv.includes('--update');

/** Run eslint and return its JSON report, tolerating the non-zero exit it uses for findings. */
function runEslint(extraArgs = []) {
  try {
    return execFileSync('npx', ['eslint', '.', '-f', 'json', ...extraArgs], {
      cwd: frontendRoot,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    if (typeof error.stdout === 'string' && error.stdout.trim() !== '') {
      return error.stdout;
    }

    throw error;
  }
}

const report = JSON.parse(runEslint());
const errors = report.reduce((sum, file) => sum + file.errorCount, 0);
const warnings = report.reduce((sum, file) => sum + file.warningCount, 0);

if (errors > 0) {
  console.error(`✗ 抑制されていない error が ${errors} 件あります。npm run lint の出力を見てください。`);
  process.exit(1);
}

// --- warning のラチェット -------------------------------------------------
if (update) {
  writeFileSync(warningBaselinePath, `${warnings}\n`);
  console.log(`✓ eslint-warning-baseline を ${warnings} に更新しました。`);
} else {
  if (!existsSync(warningBaselinePath)) {
    console.error('✗ eslint-warning-baseline がありません。npm run lint:baseline -- --update で作成してください。');
    process.exit(1);
  }

  const baseline = Number(readFileSync(warningBaselinePath, 'utf8').trim());

  if (warnings > baseline) {
    console.error(
      `✗ warning が増えました: ${baseline} → ${warnings}（+${warnings - baseline}）。` +
        '\n  ベースラインは上げられません。新しい warning を直してください。',
    );
    process.exit(1);
  }

  if (warnings < baseline) {
    console.error(
      `✗ warning が ${baseline} → ${warnings} に減りました。良い変化ですが、ベースラインの更新が要ります:` +
        '\n  npm run lint:baseline -- --update' +
        '\n  （下げておかないと、減った分だけ将来の新規 warning を無言で吸収してしまいます）',
    );
    process.exit(1);
  }

  console.log(`✓ warning は据え置き ${warnings} 件（ベースライン一致）。`);
}

// --- suppressions の stale 検査 -------------------------------------------
if (!existsSync(suppressionsPath)) {
  console.error('✗ eslint-suppressions.json がありません。npx eslint . --suppress-all で作成してください。');
  process.exit(1);
}

const backupPath = `${suppressionsPath}.ratchet-backup`;
copyFileSync(suppressionsPath, backupPath);

try {
  runEslint(['--prune-suppressions']);
  const before = readFileSync(backupPath, 'utf8');
  const after = readFileSync(suppressionsPath, 'utf8');

  if (before !== after) {
    if (update) {
      console.log('✓ eslint-suppressions.json から stale エントリを削除しました。');
    } else {
      copyFileSync(backupPath, suppressionsPath);
      console.error(
        '✗ eslint-suppressions.json に stale なエントリがあります（凍結されているのに実際は直っている違反）。' +
          '\n  npm run lint:baseline -- --update で刈り取ってコミットしてください。',
      );
      process.exit(1);
    }
  } else {
    console.log('✓ eslint-suppressions.json に stale エントリなし。');
  }
} finally {
  unlinkSync(backupPath);
}

// --- knip のラチェット ----------------------------------------------------
// knip には抑制ファイルの仕組みが無いので、warning と同じく件数の上限で守る。
// 内訳（どのファイル・どの export か）は `npm run knip` を叩けば読める。
const knipBaselinePath = resolve(frontendRoot, 'knip-baseline');
let knipRaw;

try {
  knipRaw = execFileSync('npx', ['knip', '--reporter', 'json'], {
    cwd: frontendRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (error) {
  knipRaw = typeof error.stdout === 'string' ? error.stdout : '';
}

const knipIssues = JSON.parse(knipRaw.trim() === '' ? '{"issues":[]}' : knipRaw).issues ?? [];
const knipCount = knipIssues.reduce(
  (sum, entry) =>
    sum +
    Object.entries(entry)
      .filter(([key, value]) => key !== 'file' && Array.isArray(value))
      .reduce((inner, [, value]) => inner + value.length, 0),
  0,
);

if (update) {
  writeFileSync(knipBaselinePath, `${knipCount}\n`);
  console.log(`✓ knip-baseline を ${knipCount} に更新しました。`);
} else {
  if (!existsSync(knipBaselinePath)) {
    console.error('✗ knip-baseline がありません。npm run lint:baseline -- --update で作成してください。');
    process.exit(1);
  }

  const knipBaseline = Number(readFileSync(knipBaselinePath, 'utf8').trim());

  if (knipCount > knipBaseline) {
    console.error(
      `✗ knip の指摘が増えました: ${knipBaseline} → ${knipCount}（+${knipCount - knipBaseline}）。` +
        '\n  npm run knip で内訳を見てください（未使用ファイル・未使用 export の新規追加）。',
    );
    process.exit(1);
  }

  if (knipCount < knipBaseline) {
    console.error(
      `✗ knip の指摘が ${knipBaseline} → ${knipCount} に減りました。ベースラインの更新が要ります:` +
        '\n  npm run lint:baseline -- --update',
    );
    process.exit(1);
  }

  console.log(`✓ knip は据え置き ${knipCount} 件（ベースライン一致）。`);
}
