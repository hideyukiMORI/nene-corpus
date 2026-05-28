import { useEffect } from 'react';
import { applyLocaleFontFamily, toBcp47, useLocale } from '@nene-corpus/i18n';
import { useAdminAuth } from './useAdminAuth';
import { RouterProvider, useRoute, useNavigate } from './v2/router';
import { LoginPage } from './v2/pages/LoginPage';
import { DashboardPage } from './v2/pages/DashboardPage';
import { SourcesPage } from './v2/pages/SourcesPage';
import { ConversationsPage } from './v2/pages/ConversationsPage';
import { SettingsPage } from './v2/pages/SettingsPage';

// ── Inner app (needs Router context) ─────────────────────────────────────────

function AppInner() {
  const { locale } = useLocale();
  const { token, profile, isReady, login, logout } = useAdminAuth();
  const route = useRoute();
  const navigate = useNavigate();

  // ロケール適用（既存ロジックを維持）
  useEffect(() => {
    document.documentElement.lang = toBcp47(locale);
    applyLocaleFontFamily(locale);
  }, [locale]);

  // 認証チェック: token なしで保護ルートにいたら /login へ
  useEffect(() => {
    if (!isReady) return;
    if (token === null && route !== '/login') {
      navigate('/login');
    }
  }, [isReady, token, route, navigate]);

  // ログイン後: /login にいたら /dashboard へリダイレクト
  useEffect(() => {
    if (!isReady) return;
    if (token !== null && route === '/login') {
      navigate('/dashboard');
    }
  }, [isReady, token, route, navigate]);

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 14,
        color: 'var(--ink-muted, #6E7081)',
        background: 'var(--bg, #F7F5EE)',
      }}>
        読み込み中...
      </div>
    );
  }

  // 未認証: ログインページ
  if (token === null || route === '/login') {
    return <LoginPage onLogin={login} />;
  }

  // 認証済み: ルーティング
  if (route.startsWith('/sources')) return <SourcesPage token={token} />;
  if (route.startsWith('/conversations')) return <ConversationsPage />;
  if (route.startsWith('/settings')) return <SettingsPage token={token} onLogout={logout} role={profile?.role} />;
  return <DashboardPage token={token} onLogout={logout} />;
}

// ── Root export ───────────────────────────────────────────────────────────────

export function App() {
  return (
    <RouterProvider>
      <AppInner />
    </RouterProvider>
  );
}
