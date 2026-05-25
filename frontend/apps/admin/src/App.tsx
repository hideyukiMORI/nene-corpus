import { useEffect, useState } from 'react';
import { fetchJson, type HealthResponse } from '@nene-corpus/api-client';
import { Msg, applyLocaleFontFamily, toBcp47, useLocale, useMsg } from '@nene-corpus/i18n';
import { LoginForm, SourcesPanel } from './SourcesPanel';
import { IngestionPanel } from './IngestionPanel';
import { ConversationLogsPanel } from './ConversationLogsPanel';
import { AppearancePanel } from './AppearancePanel';
import { LocaleSelector } from './LocaleSelector';
import { ThemeToggle } from './ThemeToggle';
import { useAdminAuth } from './useAdminAuth';

export function App() {
  const t = useMsg();
  const { locale } = useLocale();
  const { token, profile, isReady, error, login, logout } = useAdminAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [sourcesReloadKey, setSourcesReloadKey] = useState(0);

  useEffect(() => {
    document.documentElement.lang = toBcp47(locale);
    applyLocaleFontFamily(locale);
  }, [locale]);

  useEffect(() => {
    fetchJson<HealthResponse>('/health')
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center nc-text-muted">
        {t(Msg.common.loading)}
      </div>
    );
  }

  return (
    <div className="min-h-screen text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-header/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{t(Msg.admin.app.title)}</h1>
            <p className="nc-text-muted">
              {health
                ? t(Msg.admin.app.healthStatus, {
                    service: health.service,
                    status: health.status,
                  })
                : t(Msg.admin.app.healthUnavailable)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
            <ThemeToggle />
            <LocaleSelector />
            {profile && (
              <>
                <span className="nc-text-muted">{profile.email}</span>
                <button className="nc-btn" type="button" onClick={logout}>
                  {t(Msg.common.signOut)}
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {token === null ? (
          <LoginForm error={error} onLogin={login} />
        ) : (
          <>
            <IngestionPanel token={token} onUploaded={() => setSourcesReloadKey((key) => key + 1)} />
            <SourcesPanel token={token} reloadKey={sourcesReloadKey} />
            <ConversationLogsPanel token={token} />
            <AppearancePanel token={token} />
          </>
        )}
      </main>
    </div>
  );
}
