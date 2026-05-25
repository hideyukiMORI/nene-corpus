import { useEffect, useState } from 'react';
import { Msg, applyLocaleFontFamily, toBcp47, useLocale, useMsg } from '@nene-corpus/i18n';
import { LoginForm, SourcesPanel } from './SourcesPanel';
import { IngestionPanel } from './IngestionPanel';
import { ConversationLogsPanel } from './ConversationLogsPanel';
import { AppearancePanel } from './AppearancePanel';
import { HelpPanel } from './HelpPanel';
import { LocaleSelector } from './LocaleSelector';
import { ThemeToggle } from './ThemeToggle';
import { scrollToHelp } from './scrollToHelp';
import { useAdminAuth } from './useAdminAuth';

export function App() {
  const t = useMsg();
  const { locale } = useLocale();
  const { token, profile, isReady, error, login, logout } = useAdminAuth();
  const [sourcesReloadKey, setSourcesReloadKey] = useState(0);

  useEffect(() => {
    document.documentElement.lang = toBcp47(locale);
    applyLocaleFontFamily(locale);
  }, [locale]);

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
            <h1 className="text-xl font-semibold tracking-tight text-brand">{t(Msg.admin.app.title)}</h1>
            {profile && <p className="nc-text-muted">{profile.email}</p>}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button className="nc-btn nc-header-btn" type="button" onClick={scrollToHelp}>
              {t(Msg.admin.help.open)}
            </button>
            <LocaleSelector />
            <ThemeToggle />
            {profile && (
              <button className="nc-btn nc-header-btn" type="button" onClick={logout}>
                {t(Msg.common.signOut)}
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {token === null ? (
          <>
            <LoginForm error={error} onLogin={login} />
            <HelpPanel />
          </>
        ) : (
          <>
            <IngestionPanel token={token} onUploaded={() => setSourcesReloadKey((key) => key + 1)} />
            <SourcesPanel token={token} reloadKey={sourcesReloadKey} />
            <ConversationLogsPanel token={token} />
            <AppearancePanel token={token} />
            <HelpPanel />
          </>
        )}
      </main>
    </div>
  );
}
