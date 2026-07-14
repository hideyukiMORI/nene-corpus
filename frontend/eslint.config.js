// ESLint flat config — 公認差異の実行可能登録の最小形（規約 W2a・issue #341）。
//
// 現時点の内容は override レイヤの消費のみ。フリート配布ルール本体
// （nene2.base / fsd / api / styling / i18n / testing と noHardcodedJapanese
// baseline ゲート）は W0b「ゲート導入」スコープで別 PR（規約 05 §9.2）。
import nene2 from '@hideyukimori/nene2-standards';

export default [
  {
    // ビルド成果物・配信物は対象外（lint 対象は将来の W0b ゲート導入で確定する）。
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.vite/**',
      'test-results/**',
    ],
  },
  // 公認差異 corpus-widget-session-token（widget の X-Session-Token — admin JWT と分離）の
  // 実行可能登録。正本: nene2-fleet-tooling registries/fleet.jsonc（規約 01 §7-1 / 02 §11 AU-2・
  // 会議 R3④A-7 — #340 の「admin のみ transport 化・widget 不触」が正運用 exemplar）。
  // gate-integrity は name `nene2/overrides/corpus-widget-session-token` で適用有無を照合する。
  // 現時点の実体は marker config（緩和ルールなし — A-7 token store 検査の配布後に差し替え座席になる）。
  ...nene2.overrides.corpusWidgetSessionToken,
];
