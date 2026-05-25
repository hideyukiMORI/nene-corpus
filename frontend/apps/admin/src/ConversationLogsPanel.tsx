import { useEffect, useState } from 'react';
import {
  listChatSessionMessages,
  listChatSessions,
  type ChatMessageListItem,
  type ChatSessionSummary,
} from '@nene-corpus/api-client';
import { Msg, formatTimestamp, useLocale, useMsg } from '@nene-corpus/i18n';
import { HelpLabel } from './HelpLabel';
import { ROLE_MSG } from './i18nLabels';

interface ConversationLogsPanelProps {
  token: string;
}

export function ConversationLogsPanel({ token }: ConversationLogsPanelProps) {
  const t = useMsg();
  const { locale } = useLocale();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageListItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions(): Promise<void> {
      setIsLoadingSessions(true);
      setError(null);

      try {
        const response = await listChatSessions(token);

        if (!cancelled) {
          setSessions(response.sessions);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.conversationLogs.loadFailed));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSessions(false);
        }
      }
    }

    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  useEffect(() => {
    if (selectedSessionId === null) {
      setMessages([]);
      return;
    }

    const sessionId = selectedSessionId;
    let cancelled = false;

    async function loadMessages(): Promise<void> {
      setIsLoadingMessages(true);
      setError(null);

      try {
        const response = await listChatSessionMessages(token, sessionId);

        if (!cancelled) {
          setMessages(response.messages);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : t(Msg.admin.conversationLogs.loadMessagesFailed),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [token, selectedSessionId, t]);

  return (
    <section className="nc-panel">
      <div className="nc-panel-head">
        <h2 className="font-medium">{t(Msg.admin.conversationLogs.title)}</h2>
        <p className="text-sm text-fg-muted">{t(Msg.admin.conversationLogs.subtitle)}</p>
      </div>

      {isLoadingSessions && (
        <p className="px-4 py-6 text-sm text-fg-muted">{t(Msg.admin.conversationLogs.loadingSessions)}</p>
      )}
      {error !== null && <p className="px-4 py-6 text-sm text-red-600">{error}</p>}

      {!isLoadingSessions && error === null && sessions.length === 0 && (
        <p className="px-4 py-6 text-sm text-fg-muted">{t(Msg.admin.conversationLogs.empty)}</p>
      )}

      {!isLoadingSessions && sessions.length > 0 && (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="overflow-x-auto border-b border-border lg:border-b-0 lg:border-r">
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
                      <td className="px-4 py-2 text-fg-muted">
                        {formatTimestamp(session.last_message_at ?? session.updated_at, locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-4">
            {selectedSessionId === null && (
              <p className="text-sm text-fg-muted">{t(Msg.admin.conversationLogs.selectSession)}</p>
            )}
            {selectedSessionId !== null && isLoadingMessages && (
              <p className="text-sm text-fg-muted">{t(Msg.admin.conversationLogs.loadingMessages)}</p>
            )}
            {selectedSessionId !== null && !isLoadingMessages && messages.length === 0 && (
              <p className="text-sm text-fg-muted">{t(Msg.admin.conversationLogs.emptyMessages)}</p>
            )}
            {selectedSessionId !== null && !isLoadingMessages && messages.length > 0 && (
              <ul className="space-y-4">
                {messages.map((message) => (
                  <li
                    key={message.message_id}
                    className={`rounded-admin border px-3 py-2 ${
                      message.role === 'assistant'
                        ? 'border-accent-border bg-accent'
                        : 'border-border bg-surface-muted'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-fg-subtle">
                      <span className="uppercase tracking-wide">{t(ROLE_MSG[message.role])}</span>
                      <time dateTime={message.created_at}>
                        {formatTimestamp(message.created_at, locale)}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    {message.citations.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-border pt-2 text-xs text-fg-muted">
                        {message.citations.map((citation) => (
                          <li key={citation.chunk_id}>
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
                              <span> · {citation.section_label}</span>
                            )}
                            <p className="mt-0.5 text-fg-subtle">{citation.excerpt}</p>
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
