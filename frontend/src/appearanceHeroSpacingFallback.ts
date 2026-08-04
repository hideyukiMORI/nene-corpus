import type { SupportedLocale } from '@/shared/i18n';

export interface HeroSpacingCopy {
  spacingTitle: string;
  gapAfter: string;
  gapAfterHelp: string;
  paddingBottom: string;
  paddingBottomHelp: string;
  showDivider: string;
  showDividerHelp: string;
}

/**
 * Emergency copy when Vite HMR serves a stale `@/shared/i18n` catalog (empty or raw keys).
 * Keep in sync with `packages/i18n/src/locales/*.ts` hero spacing entries.
 */
export const APPEARANCE_HERO_SPACING_FALLBACK: Record<SupportedLocale, HeroSpacingCopy> = {
  ja: {
    spacingTitle: 'HERO 余白',
    gapAfter: 'HERO 下の余白',
    gapAfterHelp: 'HERO とメッセージ一覧の間隔（0 も可）。',
    paddingBottom: 'HERO 内下余白',
    paddingBottomHelp: '区切り線の上、HERO 内側の下パディング。',
    showDivider: 'HERO 区切り線を表示',
    showDividerHelp: 'HERO ブロック下のボーダーの ON/OFF。',
  },
  en: {
    spacingTitle: 'HERO spacing',
    gapAfter: 'Space below HERO',
    gapAfterHelp: 'Gap between the HERO block and the message list (0 is allowed).',
    paddingBottom: 'HERO bottom padding',
    paddingBottomHelp: 'Padding inside the HERO above the divider line.',
    showDivider: 'Show HERO divider',
    showDividerHelp: 'Toggle the bottom border under the HERO block.',
  },
  'zh-Hans': {
    spacingTitle: 'HERO 间距',
    gapAfter: 'HERO 下方间距',
    gapAfterHelp: 'HERO 与消息列表之间的间距（可为 0）。',
    paddingBottom: 'HERO 内边距（下）',
    paddingBottomHelp: '分隔线上方 HERO 区域的内边距。',
    showDivider: '显示 HERO 分隔线',
    showDividerHelp: '切换 HERO 区块底部的边框。',
  },
  fr: {
    spacingTitle: 'Espacement HERO',
    gapAfter: 'Espace sous le HERO',
    gapAfterHelp: 'Espace entre le HERO et la liste des messages (0 autorisé).',
    paddingBottom: 'Marge interne basse du HERO',
    paddingBottomHelp: 'Padding à l\'intérieur du HERO au-dessus du séparateur.',
    showDivider: 'Afficher le séparateur HERO',
    showDividerHelp: 'Active ou désactive la bordure sous le bloc HERO.',
  },
  'pt-BR': {
    spacingTitle: 'Espaçamento do HERO',
    gapAfter: 'Espaço abaixo do HERO',
    gapAfterHelp: 'Espaço entre o HERO e a lista de mensagens (0 é permitido).',
    paddingBottom: 'Preenchimento inferior do HERO',
    paddingBottomHelp: 'Preenchimento interno do HERO acima da linha divisória.',
    showDivider: 'Mostrar divisória do HERO',
    showDividerHelp: 'Ativa ou desativa a borda inferior do bloco HERO.',
  },
  de: {
    spacingTitle: 'HERO-Abstände',
    gapAfter: 'Abstand unter dem HERO',
    gapAfterHelp: 'Abstand zwischen HERO und Nachrichtenliste (0 ist erlaubt).',
    paddingBottom: 'HERO-Innenabstand unten',
    paddingBottomHelp: 'Innenabstand im HERO oberhalb der Trennlinie.',
    showDivider: 'HERO-Trennlinie anzeigen',
    showDividerHelp: 'Unterrand des HERO-Blocks ein- oder ausblenden.',
  },
};
