import { useEffect, useState } from 'react';
import { fetchJson, type HealthResponse } from '@nene-corpus/api-client';
import { toBcp47, useLocale } from '@nene-corpus/i18n';
import { cssVars } from '@nene-corpus/tokens';
import { LoginForm, SourcesPanel } from './SourcesPanel';
import { IngestionPanel } from './IngestionPanel';
import { ConversationLogsPanel } from './ConversationLogsPanel';
import { useAdminAuth } from './useAdminAuth';

export function App() {
  const { locale } = useLocale();
  const { token, profile, isReady, error, login, logout } = useAdminAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [sourcesReloadKey, setSourcesReloadKey] = useState(0);

  useEffect(() => {
    document.documentElement.lang = toBcp47(locale);
  }, [locale]);

  useEffect(() => {
    fetchJson<HealthResponse>('/health')
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">NeNe Corpus Admin</h1>
            <p className="text-sm text-slate-600">
              {health ? `${health.service} — ${health.status}` : 'API health unavailable'}
            </p>
          </div>
          {profile && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-600">{profile.email}</span>
              <button
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                type="button"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          )}
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
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-medium">Widget theme preview</h2>
              <p className="mt-2 text-sm text-slate-600">
                Admin uses Tailwind. The embed widget uses BEM + CSS variables such as{' '}
                <code className="rounded bg-slate-100 px-1">{cssVars.colorPrimary}</code>.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
