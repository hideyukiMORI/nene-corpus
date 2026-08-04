export type AdminTheme = 'light' | 'dark';

export const ADMIN_THEME_STORAGE_KEY = 'nene-corpus.admin.theme';

export function resolveInitialAdminTheme(): AdminTheme {
  try {
    const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage unavailable — fall through to system preference.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyAdminTheme(theme: AdminTheme, root: HTMLElement = document.documentElement): void {
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
}

export function writeStoredAdminTheme(theme: AdminTheme): void {
  try {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  } catch {
    // ignore quota / privacy mode
  }
}

export function toggleAdminTheme(theme: AdminTheme): AdminTheme {
  return theme === 'light' ? 'dark' : 'light';
}
