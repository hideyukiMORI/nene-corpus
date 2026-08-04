import { LocaleSelector } from './LocaleSelector';
import { useNavigate } from './router';
import type { V2Theme } from './theme';

interface TopbarProps {
  crumb: string;
  theme: V2Theme;
  onToggleTheme: () => void;
  onToggleDrawer?: () => void;
  userEmail?: string;
}

export function Topbar({ crumb, theme, onToggleTheme, onToggleDrawer, userEmail = 'admin@example.com' }: TopbarProps) {
  const initials = userEmail.charAt(0).toLowerCase();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <button
        type="button"
        className="hamburger"
        aria-label="メニューを開閉"
        onClick={onToggleDrawer}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="brand">
        <div className="brand-mark">n</div>
        <div className="brand-name">
          NeNe <span className="dim">Corpus</span>
          <span className="admin">Admin</span>
        </div>
      </div>
      <div className="topbar-mid">
        <span>AYANE</span>
        <span className="sep">/</span>
        <span className="leaf">{crumb}</span>
      </div>
      <div className="topbar-right">
        {/* 検索 pill — 仮実装、クリック不能 */}
        <div className="kbd-search" aria-label="検索（未実装）" role="button">
          <SearchIcon />
          <span>検索...</span>
          <span className="kbd">⌘K</span>
        </div>

        {/* ロケール選択 */}
        <LocaleSelector />

        {/* テーマトグル */}
        <div className="theme-toggle" role="group" aria-label="テーマ切替">
          <button
            type="button"
            className={theme === 'light' ? 'on' : ''}
            aria-label="ライトモード"
            onClick={() => theme !== 'light' && onToggleTheme()}
          >
            <SunIcon />
          </button>
          <button
            type="button"
            className={theme === 'dark' ? 'on' : ''}
            aria-label="ダークモード"
            onClick={() => theme !== 'dark' && onToggleTheme()}
          >
            <MoonIcon />
          </button>
        </div>

        {/* 通知ベル */}
        <button type="button" className="icon-btn" aria-label="お知らせ">
          <BellIcon />
        </button>

        {/* ヘルプ */}
        <button type="button" className="icon-btn" aria-label="ヘルプ" onClick={() => navigate('/help')}>
          <HelpQIcon />
        </button>

        {/* ユーザー */}
        <div className="who">
          <div className="avatar">{initials}</div>
          <span>{userEmail}</span>
        </div>
      </div>
    </header>
  );
}

/* ── Inline SVG icons ── */
function HelpQIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
