// ESLint flat config — フリート配布ルール本体の合成形（規約 01 §2・05 §2.1・issue #370）。
//
// `npm run lint` はこの config で走り、`npm run check` に組み込まれている（= CI の
// required チェックに乗る）。既存違反は `eslint-suppressions.json` に凍結してあり、
// **新規違反だけが赤になる**。凍結分は減らす方向にしか動かせない（shrink-only）ことを
// `npm run lint:baseline` が機械で守る。詳細は docs/development/frontend-gates.md。
import nene2 from '@hideyukimori/nene2-standards';

export default [
  {
    // ビルド成果物・配信物・型プロジェクト外のファイルは対象外。config 自身は tsconfig の
    // include に無く、base の typed projectService が解決できない。
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.vite/**',
      'test-results/**',
      'public/**',
      '*.config.ts',
      '*.config.js',
    ],
  },
  // 配布 config の合成（README の正準順）。fsd/api/i18n/testing が FSD 境界・transport 禁止・
  // a11y・testing-library を持ち込む。styling は FSD 正準の引数なしエントリ。
  ...nene2.base,
  ...nene2.fsd,
  ...nene2.api,
  ...nene2.styling,
  ...nene2.i18n,
  ...nene2.testing,
  // 公認差異 corpus-widget-session-token（widget の X-Session-Token — admin JWT と分離）の
  // 実行可能登録。正本: nene2-fleet-tooling registries/fleet.jsonc（規約 01 §7-1 / 02 §11 AU-2・
  // 会議 R3④A-7 — #340 の「admin のみ transport 化・widget 不触」が正運用 exemplar）。
  // gate-integrity は name `nene2/overrides/corpus-widget-session-token` で適用有無を照合する。
  ...nene2.overrides.corpusWidgetSessionToken,
];
