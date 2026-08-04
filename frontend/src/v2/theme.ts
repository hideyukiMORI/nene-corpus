/**
 * v2 テーマユーティリティ
 * - <html data-theme="dark"> 属性を操作する
 * - 既存の ThemeProvider / theme.ts と共存する
 *   (既存コードは .dark クラスも付与するので両方が機能する)
 */

export const V2_THEME_STORAGE_KEY = 'corpus-admin-theme';

export type V2Theme = 'light' | 'dark';

/**
 * localStorage から保存済みテーマを読み込む。
 * 存在しない場合は prefers-color-scheme で推定する。
 */
export function resolveV2Theme(): V2Theme {
  try {
    const stored = localStorage.getItem(V2_THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // ignore
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * <html data-theme="dark|light"> を設定する。
 * 既存 theme.ts の applyAdminTheme は .dark クラスも設定するので
 * ここでは data-theme 属性のみを担う。
 */
export function applyV2Theme(theme: V2Theme): void {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

/** テーマを保存して適用する */
export function setV2Theme(theme: V2Theme): void {
  applyV2Theme(theme);
  try {
    localStorage.setItem(V2_THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

/** 現在のテーマをトグルして返す */
export function toggleV2Theme(current: V2Theme): V2Theme {
  return current === 'light' ? 'dark' : 'light';
}
