import type { ReactNode } from 'react';
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
  children: ReactNode;
}

export function Layout({
  active,
  crumb,
  corpusStatus,
  modelStatus,
  stats,
  children,
}: LayoutProps) {
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <div className="v2-shell">
      <Topbar crumb={crumb} theme={theme} onToggleTheme={toggleTheme} />
      <div className="shell">
        <Sidebar active={active} corpusStatus={corpusStatus} modelStatus={modelStatus} />
        <main className="main">
          <div className="main-inner">
            {children}
          </div>
        </main>
        <Statusbar corpusStatus={corpusStatus} modelStatus={modelStatus} stats={stats} />
      </div>
    </div>
  );
}
