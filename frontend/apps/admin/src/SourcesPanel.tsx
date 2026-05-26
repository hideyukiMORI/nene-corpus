import { FormEvent, useCallback, useEffect, useState } from 'react';
import { listSources, type SourceListItem } from '@nene-corpus/api-client';
import { adminApiBase } from './config';
import { Msg, formatTimestamp, useLocale, useMsg } from '@nene-corpus/i18n';
import { HelpLabel } from './HelpLabel';
import { SOURCE_STATUS_MSG, SOURCE_TYPE_MSG } from './i18nLabels';
import { SourceDocumentsPanel } from './SourceDocumentsPanel';

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

interface SourcesPanelProps {
  token: string;
  reloadKey?: number;
  onDocumentsChanged?: () => void;
}

export function SourcesPanel({ token, reloadKey = 0, onDocumentsChanged }: SourcesPanelProps) {
  const t = useMsg();
  const { locale } = useLocale();
  const [sources, setSources] = useState<SourceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(DEFAULT_PAGE_SIZE);
  const [managingSource, setManagingSource] = useState<{ id: number; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ページネーション派生値
  const currentPage = total === 0 ? 1 : Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageSize, total);
  const hasPrev = offset > 0;
  const hasNext = offset + pageSize < total;

  // ページ入力フィールド（controlled）
  const [pageInput, setPageInput] = useState(String(currentPage));
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // reloadKey が変わったら先頭ページに戻す
  useEffect(() => {
    setOffset(0);
  }, [reloadKey]);

  const load = useCallback(
    async (currentOffset: number, currentPageSize: number, signal?: AbortSignal): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listSources(token, adminApiBase, {
          limit: currentPageSize,
          offset: currentOffset,
        });

        if (signal?.aborted) {
          return;
        }

        setSources(response.sources);
        setTotal(response.total);
      } catch (cause: unknown) {
        if (!signal?.aborted) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.sources.loadFailed));
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [token, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(offset, pageSize, controller.signal);

    return () => {
      controller.abort();
    };
  }, [load, offset, pageSize, reloadKey]);

  function handlePageSizeChange(newSize: (typeof PAGE_SIZE_OPTIONS)[number]): void {
    setPageSize(newSize);
    setOffset(0);
  }

  function handlePageInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const value = event.target.value;
    setPageInput(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      setOffset((parsed - 1) * pageSize);
    }
  }

  function handlePageInputBlur(): void {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(1, Math.min(totalPages, parsed));
      setOffset((clamped - 1) * pageSize);
      setPageInput(String(clamped));
    } else {
      setPageInput(String(currentPage));
    }
  }

  function handlePageInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }

  return (
    <section className="nc-panel">
      <div className="nc-panel-head">
        <h2 className="font-medium">{t(Msg.admin.sources.title)}</h2>
        <p>{t(Msg.admin.sources.subtitle)}</p>
      </div>
      {isLoading && <p className="px-4 py-6 nc-text-muted">{t(Msg.admin.sources.loading)}</p>}
      {error !== null && <p className="px-4 py-6 text-sm text-red-600">{error}</p>}
      {!isLoading && error === null && sources.length === 0 && (
        <p className="px-4 py-6 nc-text-muted">{t(Msg.admin.sources.empty)}</p>
      )}
      {!isLoading && sources.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="nc-table-head">
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
                  <th className="px-4 py-2 font-medium">{t(Msg.admin.documents.manage)}</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.source_id} className="nc-table-row">
                    <td className="break-all min-w-0 max-w-xs px-4 py-2 font-medium">{source.name}</td>
                    <td className="px-4 py-2 uppercase nc-text-subtle tracking-wide">
                      {t(SOURCE_TYPE_MSG[source.source_type])}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={source.status} />
                    </td>
                    <td className="px-4 py-2 tabular-nums">{source.document_count}</td>
                    <td className="px-4 py-2 tabular-nums">{source.chunk_count}</td>
                    <td className="px-4 py-2 nc-text-timestamp">
                      {formatTimestamp(source.updated_at, locale)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="nc-btn text-xs"
                        type="button"
                        onClick={() =>
                          setManagingSource({ id: source.source_id, name: source.name })
                        }
                      >
                        {t(Msg.admin.documents.manage)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページャフッター */}
          {total > 0 && (
            <div className="space-y-1.5 border-t border-border px-4 py-2">
              {/* 行 1: 件数 + 表示件数セレクタ */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs nc-text-muted">
                  {t(Msg.admin.sources.pageInfo, { from, to, total })}
                </span>
                <select
                  aria-label={t(Msg.admin.sources.perPageLabel)}
                  className="rounded-admin border border-border bg-surface py-0.5 pl-1.5 pr-6 text-xs text-fg"
                  value={pageSize}
                  onChange={(event) =>
                    handlePageSizeChange(
                      Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number],
                    )
                  }
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* 行 2: ページナビ（複数ページの場合のみ） */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    className="nc-btn text-xs disabled:opacity-40"
                    type="button"
                    aria-label={t(Msg.admin.sources.pageFirst)}
                    disabled={!hasPrev}
                    onClick={() => setOffset(0)}
                  >
                    {t(Msg.admin.sources.pageFirst)}
                  </button>
                  <button
                    className="nc-btn text-xs disabled:opacity-40"
                    type="button"
                    disabled={!hasPrev}
                    onClick={() => setOffset(Math.max(0, offset - pageSize))}
                  >
                    {t(Msg.admin.sources.pagePrev)}
                  </button>
                  <input
                    type="number"
                    value={pageInput}
                    min={1}
                    max={totalPages}
                    className="w-12 rounded-admin border border-border bg-surface px-1 py-0.5 text-center text-xs text-fg"
                    onChange={handlePageInputChange}
                    onBlur={handlePageInputBlur}
                    onKeyDown={handlePageInputKeyDown}
                  />
                  <span className="text-xs nc-text-muted">/ {totalPages}</span>
                  <button
                    className="nc-btn text-xs disabled:opacity-40"
                    type="button"
                    disabled={!hasNext}
                    onClick={() => setOffset(offset + pageSize)}
                  >
                    {t(Msg.admin.sources.pageNext)}
                  </button>
                  <button
                    className="nc-btn text-xs disabled:opacity-40"
                    type="button"
                    aria-label={t(Msg.admin.sources.pageLast)}
                    disabled={!hasNext}
                    onClick={() => setOffset((totalPages - 1) * pageSize)}
                  >
                    {t(Msg.admin.sources.pageLast)}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {managingSource !== null && (
        <SourceDocumentsPanel
          token={token}
          sourceId={managingSource.id}
          sourceName={managingSource.name}
          onChanged={() => onDocumentsChanged?.()}
          onClose={() => setManagingSource(null)}
        />
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: SourceListItem['status'] }) {
  const t = useMsg();
  const styles: Record<SourceListItem['status'], string> = {
    pending: 'bg-surface-muted text-fg-muted',
    processing: 'bg-amber-500/15 text-amber-700',
    ready: 'bg-emerald-500/15 text-emerald-700',
    failed: 'bg-red-500/15 text-red-700',
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
    <section className="nc-panel mx-auto max-w-md p-6">
      <h2 className="text-lg font-medium">{t(Msg.admin.auth.title)}</h2>
      <p className="mt-1 nc-text-muted">{t(Msg.admin.auth.subtitle)}</p>
      <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block text-sm">
          <span className="font-medium text-fg">{t(Msg.admin.auth.email)}</span>
          <input
            className="nc-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-fg">{t(Msg.admin.auth.password)}</span>
          <input
            className="nc-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error !== null && <p className="text-sm text-red-600">{error}</p>}
        <button className="nc-btn-primary w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t(Msg.admin.auth.submitting) : t(Msg.admin.auth.submit)}
        </button>
      </form>
    </section>
  );
}
