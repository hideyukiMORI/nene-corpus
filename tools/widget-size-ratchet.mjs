#!/usr/bin/env node
// embed widget のバンドルサイズのラチェット（#374・設計ノート #361 の R1）。
//
// widget は**第三者のホームページに <script> で配信される**。admin のコードや Tailwind の
// preflight が紛れ込んでも、ビルドは成功しテストも通り CI も緑のまま——#368 の publicDir と
// 同じ「静かに壊れる」型なので、サイズという別の軸で見張る。
//
// 見ているのは 2 方向。増加だけでなく**減少も赤にする**のがこのラチェットの肝で、
// widget が壊れて中身が落ちてもサイズは減るため（「静かに何もしない」の逆向き）。
// どちらに動いてもベースラインの更新＝レビューで数字が見える形にする。
//
// gzip 側も併せて見る。実際にネットワークを流れるのはこちらで、生サイズだけだと
// 圧縮率の変化（= 中身の性質の変化）を見逃す。
//
// 使い方: npm run verify:build に同乗（build / build:release の両経路で走る）
//         npm run size:baseline -- --update  でベースラインを更新する
import { gzipSync } from 'node:zlib';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = resolve(projectRoot, 'frontend/widget-size-baseline.json');
const update = process.argv.includes('--update');

/** 許容幅。これを超える変化はベースラインの更新（＝レビューで数字が見えること）を要求する。 */
const TOLERANCE = 0.01;

const ARTIFACTS = ['widget.js', 'widget.css'];

const measured = {};

for (const artifact of ARTIFACTS) {
  const path = resolve(projectRoot, 'public_html', artifact);

  if (!existsSync(path)) {
    console.error(`✗ public_html/${artifact} がありません（ビルドしてから実行してください）。`);
    process.exit(1);
  }

  const buffer = readFileSync(path);
  measured[artifact] = { bytes: buffer.length, gzip: gzipSync(buffer).length };
}

const format = (n) => `${(n / 1024).toFixed(2)} kB`;

if (update) {
  writeFileSync(baselinePath, `${JSON.stringify(measured, null, 2)}\n`);
  console.log('✓ widget-size-baseline.json を更新しました:');

  for (const artifact of ARTIFACTS) {
    console.log(
      `    ${artifact}  ${format(measured[artifact].bytes)}  (gzip ${format(measured[artifact].gzip)})`,
    );
  }

  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error('✗ widget-size-baseline.json がありません。npm run size:baseline -- --update で作成してください。');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const failures = [];

for (const artifact of ARTIFACTS) {
  for (const metric of ['bytes', 'gzip']) {
    const before = baseline[artifact]?.[metric];
    const after = measured[artifact][metric];

    if (typeof before !== 'number') {
      failures.push(`${artifact} の ${metric} がベースラインにありません。--update で作り直してください。`);
      continue;
    }

    const delta = after - before;
    const ratio = delta / before;
    const label = `${artifact} ${metric === 'gzip' ? '(gzip)' : '(raw)'}`;

    if (ratio > TOLERANCE) {
      failures.push(
        `${label} が ${format(before)} → ${format(after)} に増えました（+${(ratio * 100).toFixed(1)}%）。` +
          '\n      第三者ページに配信される物なので、増えた中身を確認してください' +
          '（admin コードや Tailwind の混入が典型）。' +
          '\n      意図した増加なら npm run size:baseline -- --update で数字を更新し、差分をコミットに含める。',
      );
    } else if (ratio < -TOLERANCE) {
      failures.push(
        `${label} が ${format(before)} → ${format(after)} に減りました（${(ratio * 100).toFixed(1)}%）。` +
          '\n      **widget が壊れて中身が落ちても減ります。** 実際に動くことを確認してから' +
          '\n      npm run size:baseline -- --update で更新してください。',
      );
    }
  }
}

if (failures.length > 0) {
  console.error('✗ widget バンドルのサイズがベースラインから外れました:');

  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }

  process.exit(1);
}

console.log(
  `✓ widget のサイズは据え置き: ` +
    ARTIFACTS.map(
      (a) => `${a} ${format(measured[a].bytes)}/gzip ${format(measured[a].gzip)}`,
    ).join('  '),
);
