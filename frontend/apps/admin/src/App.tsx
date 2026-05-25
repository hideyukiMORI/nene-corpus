import { useEffect, useState } from 'react';
import { fetchJson, type HealthResponse } from '@nene-corpus/api-client';
import { cssVars } from '@nene-corpus/tokens';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<HealthResponse>('/health')
      .then(setHealth)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Health check failed');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">NeNe Corpus Admin</h1>
        <p className="text-sm text-slate-600">Phase 3 scaffold — sources, ingestion, and logs land here.</p>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8 space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-medium">API health</h2>
          {health && (
            <p className="mt-2 text-sm">
              {health.service} — <span className="font-mono">{health.status}</span>
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-medium">Widget theme preview</h2>
          <p className="mt-2 text-sm text-slate-600">
            Admin uses Tailwind. The embed widget uses BEM + CSS variables such as{' '}
            <code className="rounded bg-slate-100 px-1">{cssVars.colorPrimary}</code>.
          </p>
        </section>
      </main>
    </div>
  );
}
