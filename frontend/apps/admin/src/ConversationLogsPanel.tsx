import { useCallback, useEffect, useState } from 'react';
import {
  listChatSessionMessages,
  listChatSessions,
  type ChatMessageListItem,
  type ChatSessionSummary,
} from '@nene-corpus/api-client';
import { adminApiBase } from './config';
import { Msg, formatTimestamp, useLocale, useMsg } from '@nene-corpus/i18n';
import { HelpLabel } from './HelpLabel';
import { ROLE_MSG } from './i18nLabels';
import { formatClientIp, hasSessionMetadata } from './conversationLogsFormat';

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

interface ConversationLogsPanelProps {
  token: string;
}

export function ConversationLogsPanel({ token }: ConversationLogsPanelProps) {
  const t = useMsg();
  const { locale } = useLocale();

  // --- セッション一覧ステート ---
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(DEFAULT_PAGE_SIZE);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // --- 選択セッションステート ---
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageListItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

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

  const loadSessions = useCallback(
    async (currentOffset: number, currentPageSize: number, signal?: AbortSignal): Promise<void> => {
      setIsLoadingSessions(true);
      setListError(null);

      try {
        const response = await listChatSessions(token, adminApiBase, {
          limit: currentPageSize,
          offset: currentOffset,
        });

        if (signal?.aborted) {
          return;
        }

        setSessions(response.sessions);
        setTotal(response.total);
      } catch (cause: unknown) {
        if (!signal?.aborted) {
          setListError(cause instanceof Error ? cause.message : t(Msg.admin.conversationLogs.loadFailed));
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoadingSessions(false);
        }
      }
    },
    [token, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadSessions(offset, pageSize, controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadSessions, offset, pageSize]);

  useEffect(() => {
    if (selectedSessionId === null) {
      setMessages([]);
      return;
    }

    const sessionId = selectedSessionId;
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoadingMessages(true);
      setMessagesError(null);

      try {
        const response = await listChatSessionMessages(token, sessionId, adminApiBase);

        if (!cancelled) {
          setMessages(response.messages);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setMessagesError(
            cause instanceof Error ? cause.message : t(Msg.admin.conversationLogs.loadMessagesFailed),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [token, selectedSessionId, t]);

  function handlePageSizeChange(newSize: (typeof PAGE_SIZE_OPTIONS)[number]): void {
    setPageSize(newSize);
    setOffset(0);
    setSelectedSessionId(null);
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
        <h2 className="font-medium">{t(Msg.admin.conversationLogs.title)}</h2>
        <p>{t(Msg.admin.conversationLogs.subtitle)}</p>
      </div>

      {isLoadingSessions && (
        <p className="px-4 py-6 nc-text-muted">{t(Msg.admin.conversationLogs.loadingSessions)}</p>
      )}
      {listError !== null && <p className="px-4 py-6 text-sm text-red-600">{listError}</p>}

      {!isLoadingSessions && listError === null && sessions.length === 0 && (
        <p className="px-4 py-6 nc-text-muted">{t(Msg.admin.conversationLogs.empty)}</p>
      )}

      {!isLoadingSessions && (sessions.length > 0 || total > 0) && (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">

          {/* 左カラム：セッション一覧 */}
          <div className="flex flex-col border-b border-border lg:border-b-0 lg:border-r">
            <div className="overflow-x-auto nc-scroll flex-1">
              <table className="min-w-full text-sm">
                <thead className="nc-table-head">
                  <tr>
                    <th className="px-4 py-2 font-medium">
                      <HelpLabel
                        label={t(Msg.admin.conversationLogs.columnSession)}
                        help={t(Msg.admin.conversationLogs.columnSessionHelp)}
                      />
                    </th>
                    <th className="px-4 py-2 font-medium">
                      <HelpLabel
                        label={t(Msg.admin.conversationLogs.columnMessages)}
                        help={t(Msg.admin.conversationLogs.columnMessagesHelp)}
                      />
                    </th>
                    <th className="px-4 py-2 font-medium">
                      <HelpLabel
                        label={t(Msg.admin.conversationLogs.columnClientIp)}
                        help={t(Msg.admin.conversationLogs.columnClientIpHelp)}
                      />
                    </th>
                    <th className="px-4 py-2 font-medium">
                      <HelpLabel
                        label={t(Msg.admin.conversationLogs.columnLastActivity)}
                        help={t(Msg.admin.conversationLogs.columnLastActivityHelp)}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const isSelected = selectedSessionId === session.session_id;

                    return (
                      <tr
                        key={session.session_id}
                        className={`nc-table-row cursor-pointer ${
                          isSelected ? 'bg-accent' : 'hover:bg-surface-muted'
                        }`}
                        onClick={() => setSelectedSessionId(session.session_id)}
                      >
                        <td className="px-4 py-2 font-medium tabular-nums">#{session.session_id}</td>
                        <td className="px-4 py-2 tabular-nums">{session.message_count}</td>
                        <td className="px-4 py-2 font-mono text-xs nc-text-muted" title={session.client_ip ?? undefined}>
                          {formatClientIp(session.client_ip)}
                        </td>
                        <td className="px-4 py-2 nc-text-timestamp">
                          {formatTimestamp(session.last_message_at ?? session.updated_at, locale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ページャフッター */}
            {total > 0 && (
              <div className="shrink-0 space-y-1.5 border-t border-border px-3 py-2">
                {/* 行 1: 件数 + 表示件数セレクタ */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs nc-text-muted">
                    {t(Msg.admin.conversationLogs.pageInfo, { from, to, total })}
                  </span>
                  <select
                    aria-label={t(Msg.admin.conversationLogs.perPageLabel)}
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
                      aria-label={t(Msg.admin.conversationLogs.pageFirst)}
                      disabled={!hasPrev}
                      onClick={() => setOffset(0)}
                    >
                      {t(Msg.admin.conversationLogs.pageFirst)}
                    </button>
                    <button
                      className="nc-btn text-xs disabled:opacity-40"
                      type="button"
                      disabled={!hasPrev}
                      onClick={() => setOffset(Math.max(0, offset - pageSize))}
                    >
                      {t(Msg.admin.conversationLogs.pagePrev)}
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
                      {t(Msg.admin.conversationLogs.pageNext)}
                    </button>
                    <button
                      className="nc-btn text-xs disabled:opacity-40"
                      type="button"
                      aria-label={t(Msg.admin.conversationLogs.pageLast)}
                      disabled={!hasNext}
                      onClick={() => setOffset((totalPages - 1) * pageSize)}
                    >
                      {t(Msg.admin.conversationLogs.pageLast)}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右カラム：メッセージ */}
          <div className="px-4 py-4">
            {selectedSessionId === null && (
              <p className="nc-text-muted">{t(Msg.admin.conversationLogs.selectSession)}</p>
            )}
            {selectedSessionId !== null && (() => {
              const selectedSession = sessions.find((s) => s.session_id === selectedSessionId);

              return (
                <>
                  {selectedSession !== undefined && hasSessionMetadata(selectedSession) && (
                    <div className="mb-4 rounded-admin border border-border bg-surface-muted px-3 py-3 text-sm">
                      <dl className="space-y-2">
                        {selectedSession.user_agent !== null && selectedSession.user_agent.trim() !== '' && (
                          <div>
                            <dt className="nc-text-muted">
                              <HelpLabel
                                label={t(Msg.admin.conversationLogs.sessionUserAgent)}
                                help={t(Msg.admin.conversationLogs.sessionUserAgentHelp)}
                              />
                            </dt>
                            <dd className="mt-0.5 break-all font-mono text-xs">{selectedSession.user_agent}</dd>
                          </div>
                        )}
                        {selectedSession.referer !== null && selectedSession.referer.trim() !== '' && (
                          <div>
                            <dt className="nc-text-muted">
                              <HelpLabel
                                label={t(Msg.admin.conversationLogs.sessionReferer)}
                                help={t(Msg.admin.conversationLogs.sessionRefererHelp)}
                              />
                            </dt>
                            <dd className="mt-0.5 break-all text-xs">{selectedSession.referer}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </>
              );
            })()}
            {selectedSessionId !== null && isLoadingMessages && (
              <p className="nc-text-muted">{t(Msg.admin.conversationLogs.loadingMessages)}</p>
            )}
            {messagesError !== null && (
              <p className="text-sm text-red-600">{messagesError}</p>
            )}
            {selectedSessionId !== null && !isLoadingMessages && messages.length === 0 && messagesError === null && (
              <p className="nc-text-muted">{t(Msg.admin.conversationLogs.emptyMessages)}</p>
            )}
            {selectedSessionId !== null && !isLoadingMessages && messages.length > 0 && (
              <ul className="nc-scroll max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <li
                    key={message.message_id}
                    className={`rounded-admin border px-3 py-2 ${
                      message.role === 'assistant'
                        ? 'border-accent-border bg-accent'
                        : 'border-border bg-surface-muted'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 nc-text-timestamp uppercase tracking-wide">
                      <span>{t(ROLE_MSG[message.role])}</span>
                      <time dateTime={message.created_at}>
                        {formatTimestamp(message.created_at, locale)}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    {message.citations.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-border pt-2 nc-text-muted">
                        {message.citations.map((citation) => (
                          <li key={citation.chunk_id} className="min-w-0">
                            <span className="font-medium">
                              {t(Msg.admin.conversationLogs.citationChunk, { id: citation.chunk_id })}
                            </span>
                            {citation.page_number !== undefined && (
                              <span>
                                {' '}
                                · {t(Msg.admin.conversationLogs.citationPage, { page: citation.page_number })}
                              </span>
                            )}
                            {citation.section_label !== undefined && (
                              <span className="break-words"> · {citation.section_label}</span>
                            )}
                            <p className="mt-0.5 break-words nc-text-subtle">{citation.excerpt}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
