import { useEffect, useState } from 'react';
import {
  listChatSessionMessages,
  listChatSessions,
  type ChatMessageListItem,
  type ChatSessionSummary,
} from '@nene-corpus/api-client';
import { Msg, formatTimestamp, useLocale, useMsg } from '@nene-corpus/i18n';
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
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-medium">{t(Msg.admin.conversationLogs.title)}</h2>
        <p className="text-sm text-slate-600">{t(Msg.admin.conversationLogs.subtitle)}</p>
      </div>

      {isLoadingSessions && (
        <p className="px-4 py-6 text-sm text-slate-600">{t(Msg.admin.conversationLogs.loadingSessions)}</p>
      )}
      {error !== null && <p className="px-4 py-6 text-sm text-red-600">{error}</p>}

      {!isLoadingSessions && error === null && sessions.length === 0 && (
        <p className="px-4 py-6 text-sm text-slate-600">{t(Msg.admin.conversationLogs.empty)}</p>
      )}

      {!isLoadingSessions && sessions.length > 0 && (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="overflow-x-auto border-b border-slate-200 lg:border-b-0 lg:border-r">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">{t(Msg.admin.conversationLogs.columnSession)}</th>
                  <th className="px-4 py-2 font-medium">{t(Msg.admin.conversationLogs.columnMessages)}</th>
                  <th className="px-4 py-2 font-medium">
                    {t(Msg.admin.conversationLogs.columnLastActivity)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const isSelected = selectedSessionId === session.session_id;

                  return (
                    <tr
                      key={session.session_id}
                      className={`border-t border-slate-100 cursor-pointer ${
                        isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedSessionId(session.session_id)}
                    >
                      <td className="px-4 py-2 font-medium tabular-nums">#{session.session_id}</td>
                      <td className="px-4 py-2 tabular-nums">{session.message_count}</td>
                      <td className="px-4 py-2 text-slate-600">
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
              <p className="text-sm text-slate-600">{t(Msg.admin.conversationLogs.selectSession)}</p>
            )}
            {selectedSessionId !== null && isLoadingMessages && (
              <p className="text-sm text-slate-600">{t(Msg.admin.conversationLogs.loadingMessages)}</p>
            )}
            {selectedSessionId !== null && !isLoadingMessages && messages.length === 0 && (
              <p className="text-sm text-slate-600">{t(Msg.admin.conversationLogs.emptyMessages)}</p>
            )}
            {selectedSessionId !== null && !isLoadingMessages && messages.length > 0 && (
              <ul className="space-y-4">
                {messages.map((message) => (
                  <li
                    key={message.message_id}
                    className={`rounded-md border px-3 py-2 ${
                      message.role === 'assistant'
                        ? 'border-sky-200 bg-sky-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="uppercase tracking-wide">{t(ROLE_MSG[message.role])}</span>
                      <time dateTime={message.created_at}>
                        {formatTimestamp(message.created_at, locale)}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    {message.citations.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-600">
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
                            <p className="mt-0.5 text-slate-500">{citation.excerpt}</p>
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
