import { FormEvent, useEffect, useState } from 'react';
import { listSources, type SourceListItem } from '@nene-corpus/api-client';
import { Msg, formatTimestamp, useLocale, useMsg } from '@nene-corpus/i18n';
import { HelpLabel } from './HelpLabel';
import { SOURCE_STATUS_MSG, SOURCE_TYPE_MSG } from './i18nLabels';

interface SourcesPanelProps {
  token: string;
  reloadKey?: number;
}

export function SourcesPanel({ token, reloadKey = 0 }: SourcesPanelProps) {
  const t = useMsg();
  const { locale } = useLocale();
  const [sources, setSources] = useState<SourceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSources(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listSources(token);

        if (!cancelled) {
          setSources(response.sources);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.sources.loadFailed));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSources();

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey, t]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-medium">{t(Msg.admin.sources.title)}</h2>
        <p className="text-sm text-slate-600">{t(Msg.admin.sources.subtitle)}</p>
      </div>
      {isLoading && <p className="px-4 py-6 text-sm text-slate-600">{t(Msg.admin.sources.loading)}</p>}
      {error !== null && <p className="px-4 py-6 text-sm text-red-600">{error}</p>}
      {!isLoading && error === null && sources.length === 0 && (
        <p className="px-4 py-6 text-sm text-slate-600">{t(Msg.admin.sources.empty)}</p>
      )}
      {!isLoading && sources.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">{t(Msg.admin.sources.columnName)}</th>
                <th className="px-4 py-2 font-medium">{t(Msg.admin.sources.columnType)}</th>
                <th className="px-4 py-2 font-medium">
                  <HelpLabel
                    label={t(Msg.admin.sources.columnStatus)}
                    help={t(Msg.admin.sources.columnStatusHelp)}
                  />
                </th>
                <th className="px-4 py-2 font-medium">
                  <HelpLabel
                    label={t(Msg.admin.sources.columnDocuments)}
                    help={t(Msg.admin.sources.columnDocumentsHelp)}
                  />
                </th>
                <th className="px-4 py-2 font-medium">
                  <HelpLabel
                    label={t(Msg.admin.sources.columnChunks)}
                    help={t(Msg.admin.sources.columnChunksHelp)}
                  />
                </th>
                <th className="px-4 py-2 font-medium">{t(Msg.admin.sources.columnUpdated)}</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.source_id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{source.name}</td>
                  <td className="px-4 py-2 uppercase text-xs tracking-wide text-slate-500">
                    {t(SOURCE_TYPE_MSG[source.source_type])}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={source.status} />
                  </td>
                  <td className="px-4 py-2 tabular-nums">{source.document_count}</td>
                  <td className="px-4 py-2 tabular-nums">{source.chunk_count}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {formatTimestamp(source.updated_at, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: SourceListItem['status'] }) {
  const t = useMsg();
  const styles: Record<SourceListItem['status'], string> = {
    pending: 'bg-slate-100 text-slate-700',
    processing: 'bg-amber-100 text-amber-800',
    ready: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {t(SOURCE_STATUS_MSG[status])}
    </span>
  );
}

interface LoginFormProps {
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ error, onLogin }: LoginFormProps) {
  const t = useMsg();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onLogin(email, password);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium">{t(Msg.admin.auth.title)}</h2>
      <p className="mt-1 text-sm text-slate-600">{t(Msg.admin.auth.subtitle)}</p>
      <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">{t(Msg.admin.auth.email)}</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">{t(Msg.admin.auth.password)}</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error !== null && <p className="text-sm text-red-600">{error}</p>}
        <button
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t(Msg.admin.auth.submitting) : t(Msg.admin.auth.submit)}
        </button>
      </form>
    </section>
  );
}
