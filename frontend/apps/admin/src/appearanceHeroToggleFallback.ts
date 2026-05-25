import type { SupportedLocale } from '@nene-corpus/i18n';

export interface HeroToggleCopy {
  showTitle: string;
  showTitleHelp: string;
  showDescription: string;
  showDescriptionHelp: string;
  showCta: string;
  showCtaHelp: string;
}

/**
 * Emergency copy when Vite HMR serves a stale `@nene-corpus/i18n` catalog (raw keys visible).
 * Keep in sync with `packages/i18n/src/locales/*.ts` hero toggle entries.
 */
export const APPEARANCE_HERO_TOGGLE_FALLBACK: Record<SupportedLocale, HeroToggleCopy> = {
  ja: {
    showTitle: 'タイトル',
    showTitleHelp: 'タイトルの表示／非表示を切り替えます。',
    showDescription: '説明文',
    showDescriptionHelp: '説明文の表示／非表示を切り替えます。',
    showCta: '質問ボタン',
    showCtaHelp: '「質問する」ボタンの表示／非表示を切り替えます。',
  },
  en: {
    showTitle: 'Title',
    showTitleHelp: 'Turn the welcome title on or off.',
    showDescription: 'Description',
    showDescriptionHelp: 'Turn the welcome description on or off.',
    showCta: 'Start button',
    showCtaHelp: 'Turn the start button on or off.',
  },
  'zh-Hans': {
    showTitle: '标题',
    showTitleHelp: '切换标题的显示或隐藏。',
    showDescription: '说明',
    showDescriptionHelp: '切换说明文字的显示或隐藏。',
    showCta: '提问按钮',
    showCtaHelp: '切换「开始提问」按钮的显示或隐藏。',
  },
  fr: {
    showTitle: 'Titre',
    showTitleHelp: 'Afficher ou masquer le titre d\'accueil.',
    showDescription: 'Description',
    showDescriptionHelp: 'Afficher ou masquer le texte d\'accueil.',
    showCta: 'Bouton de démarrage',
    showCtaHelp: 'Afficher ou masquer le bouton de démarrage.',
  },
  'pt-BR': {
    showTitle: 'Título',
    showTitleHelp: 'Ativar ou desativar o título de boas-vindas.',
    showDescription: 'Descrição',
    showDescriptionHelp: 'Ativar ou desativar o texto de boas-vindas.',
    showCta: 'Botão de início',
    showCtaHelp: 'Ativar ou desativar o botão de início.',
  },
  de: {
    showTitle: 'Titel',
    showTitleHelp: 'Willkommenstitel ein- oder ausblenden.',
    showDescription: 'Beschreibung',
    showDescriptionHelp: 'Willkommenstext ein- oder ausblenden.',
    showCta: 'Start-Schaltfläche',
    showCtaHelp: 'Start-Schaltfläche ein- oder ausblenden.',
  },
};
