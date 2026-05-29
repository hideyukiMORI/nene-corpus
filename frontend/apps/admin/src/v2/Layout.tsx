import { useCallback, useState, type ReactNode } from 'react';
import type { ActivePage } from './Sidebar';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { Statusbar } from './Statusbar';
import { useAdminTheme } from '../ThemeProvider';

export type { ActivePage };

export interface LayoutProps {
  active: ActivePage;
  crumb: string;
  corpusStatus?: string;
  modelStatus?: 'ok' | 'warn' | 'bad';
  stats?: string;
  onLogout?: () => void;
  children: ReactNode;
}

export function Layout({
  active,
  crumb,
  corpusStatus,
  modelStatus,
  stats,
  onLogout,
  children,
}: LayoutProps) {
  const { theme, toggleTheme } = useAdminTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className={drawerOpen ? 'v2-shell drawer-open' : 'v2-shell'}>
      <Topbar
        crumb={crumb}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleDrawer={() => setDrawerOpen((open) => !open)}
      />
      <div className="shell">
        <Sidebar
          active={active}
          corpusStatus={corpusStatus}
          modelStatus={modelStatus}
          onLogout={onLogout}
          onNavigate={closeDrawer}
        />
        <main className="main">
          <div className="main-inner">
            {children}
          </div>
        </main>
        <Statusbar corpusStatus={corpusStatus} modelStatus={modelStatus} stats={stats} />
        <div className="side-backdrop" onClick={closeDrawer} aria-hidden="true" />
      </div>
    </div>
  );
}
