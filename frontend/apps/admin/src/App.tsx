import { useEffect, useState } from 'react';
import { applyLocaleFontFamily, toBcp47, useLocale } from '@nene-corpus/i18n';
import { useAdminAuth } from './useAdminAuth';
import { LoginPage } from './v2/pages/LoginPage';
import { DashboardPage } from './v2/pages/DashboardPage';
import { SourcesPage } from './v2/pages/SourcesPage';
import { ConversationsPage } from './v2/pages/ConversationsPage';
import { SettingsPage } from './v2/pages/SettingsPage';

type V2Route = 'login' | 'dashboard' | 'sources' | 'conversations' | 'settings';

function resolveRoute(): V2Route {
  const hash = window.location.hash;
  if (hash.startsWith('#/sources'))        return 'sources';
  if (hash.startsWith('#/conversations'))  return 'conversations';
  if (hash.startsWith('#/settings'))       return 'settings';
  if (hash.startsWith('#/login'))          return 'login';
  if (hash.startsWith('#/dashboard'))      return 'dashboard';
  // デフォルト
  return 'dashboard';
}

export function App() {
  const { locale } = useLocale();
  const { token, isReady, login, logout } = useAdminAuth();
  const [route, setRoute] = useState<V2Route>(resolveRoute);

  // ロケール適用（既存ロジックを維持）
  useEffect(() => {
    document.documentElement.lang = toBcp47(locale);
    applyLocaleFontFamily(locale);
  }, [locale]);

  // hash 変化を監視してルートを更新
  useEffect(() => {
    function handleHashChange() {
      setRoute(resolveRoute());
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 認証チェック: token なしで保護ルートにいたら #/login へ
  useEffect(() => {
    if (!isReady) return;
    if (token === null && route !== 'login') {
      window.location.hash = '#/login';
    }
  }, [isReady, token, route]);

  // ログイン後: #/login にいたら #/dashboard へリダイレクト
  useEffect(() => {
    if (!isReady) return;
    if (token !== null && route === 'login') {
      window.location.hash = '#/dashboard';
    }
  }, [isReady, token, route]);

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
  if (token === null || route === 'login') {
    return <LoginPage onLogin={login} />;
  }

  // 認証済み: ルーティング
  switch (route) {
    case 'sources':       return <SourcesPage token={token} />;
    case 'conversations': return <ConversationsPage />;
    case 'settings':      return <SettingsPage token={token} onLogout={logout} />;
    case 'dashboard':
    default:              return <DashboardPage token={token} onLogout={logout} />;
  }
}
