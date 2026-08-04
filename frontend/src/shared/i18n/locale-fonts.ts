import type { SupportedLocale } from './types';

/** Admin SPA が `document.documentElement` に設定する CSS 変数名。 */
export const ADMIN_FONT_FAMILY_VAR = '--nc-admin-font-family';

/**
 * ロケール別 UI フォント（@fontsource 同梱体名と一致させる）。
 * Latin 系は Inter、CJK は Noto Sans 系でビジネス向けのトーンを揃える。
 */
export const LOCALE_FONT_STACKS: Record<SupportedLocale, string> = {
  en: '"Inter", ui-sans-serif, system-ui, sans-serif',
  ja: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif',
  fr: '"Inter", ui-sans-serif, system-ui, sans-serif',
  'zh-Hans': '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  'pt-BR': '"Inter", ui-sans-serif, system-ui, sans-serif',
  de: '"Inter", ui-sans-serif, system-ui, sans-serif',
};

export function getLocaleFontStack(locale: SupportedLocale): string {
  return LOCALE_FONT_STACKS[locale];
}

export function applyLocaleFontFamily(
  locale: SupportedLocale,
  root: HTMLElement = document.documentElement,
): void {
  root.style.setProperty(ADMIN_FONT_FAMILY_VAR, getLocaleFontStack(locale));
}
