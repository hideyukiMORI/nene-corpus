import { Msg, useMsg } from '@nene-corpus/i18n';
import { useAdminTheme } from './ThemeProvider';

export function ThemeToggle() {
  const t = useMsg();
  const { theme, toggleTheme } = useAdminTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="nc-btn nc-header-icon-btn text-brand hover:border-brand/40 hover:bg-brand-muted"
      aria-label={isDark ? t(Msg.admin.app.themeLight) : t(Msg.admin.app.themeDark)}
      title={isDark ? t(Msg.admin.app.themeLight) : t(Msg.admin.app.themeDark)}
      onClick={toggleTheme}
    >
      {isDark ? (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25M12 18.75V21M4.219 4.219l1.591 1.591M18.19 18.19l1.591 1.591M3 12h2.25M18.75 12H21M4.219 19.781l1.591-1.591M18.19 5.81l1.591-1.591M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0 1 12 21.75c-5.385 0-9.75-4.365-9.75-9.75 0-4.102 2.554-7.606 6.163-9.027.49-.184 1.026.188 1.026.704v1.332a7.522 7.522 0 0 0 3.022 5.916c.317.263.346.734.06 1.028l-1.684 1.755Z"
          />
        </svg>
      )}
    </button>
  );
}
