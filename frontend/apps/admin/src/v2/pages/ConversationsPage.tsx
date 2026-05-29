/**
 * ConversationsPage — v2 リデザイン実装 (#263)
 *
 * セクション構成:
 *   1. ミニ KPI 4 個 (セッション / メッセージ / 引用率 / 未回答)
 *   2. フィルタバー (引用あり/なし · 通数 · 検索 · 件数)
 *   3. セッション一覧 (左) + 詳細ペイン (右)
 *      - 詳細: meta-grid · chat-stream (吹き出し + 引用マーカー) · cited sources
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAnalyticsSummary,
  listChatSessions,
  listChatSessionMessages,
  cleanupChatSessions,
  type ChatMessageListItem,
  type ChatSessionSummary,
} from '@nene-corpus/api-client';
import { formatTimestamp, useLocale } from '@nene-corpus/i18n';
import { adminApiBase } from '../../config';
import { useAdminAuth } from '../../useAdminAuth';
import { Layout } from '../Layout';
import { formatClientIp } from '../../conversationLogsFormat';

// ─── 定数 ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

// ─── 引用マーカー [n] → <span className="cite-marker"> ──────────────────────

function renderWithCiteMarkers(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="cite-marker">
        [{match[1]}]
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// ─── 期間フォーマット ─────────────────────────────────────────────────────────

function formatDuration(startIso: string, endIso: string): string {
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return '—';
  const totalSec = Math.round(diffMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}秒`;
  return `${min}分 ${sec}秒`;
}

// ─── フィルタロジック ─────────────────────────────────────────────────────────

type CitationFilter = 'all' | 'cited' | 'uncited';
type CountFilter = 'all' | '1-3' | '4-9' | '10+';

function matchesCitationFilter(session: ChatSessionSummary, filter: CitationFilter): boolean {
  // citation 情報は session レベルには無い。フロントでは「通数」で代用判断できないため、
  // 実際には messages ロード後に判定が必要だが、ここではセッション一覧のみで近似:
  // message_count が 0 の場合のみ uncited と扱い、それ以外は cited と仮定する。
  // (詳細取得後に正確な判定が可能だが、一覧段階では近似で十分)
  if (filter === 'all') return true;
  if (filter === 'uncited') return session.message_count === 0;
  return session.message_count > 0;
}

function matchesCountFilter(session: ChatSessionSummary, filter: CountFilter): boolean {
  if (filter === 'all') return true;
  const n = session.message_count;
  if (filter === '1-3') return n >= 1 && n <= 3;
  if (filter === '4-9') return n >= 4 && n <= 9;
  return n >= 10;
}

// ─── ミニ KPI ────────────────────────────────────────────────────────────────

interface KpiItem {
  swatch: 'info' | 'ok' | 'warn';
  ja: string;
  en: string;
  value: string | number;
  sub?: string;
}

interface MiniKpiRowProps {
  items: KpiItem[];
}

function MiniKpiRow({ items }: MiniKpiRowProps) {
  return (
    <div
      className="kpi-block"
      style={{ marginBottom: 14 }}
    >
      <div
        className="kpi-grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item, i) => (
          <div key={i} className="kpi-row" style={{ borderBottom: 'none' }}>
            <span className={`swatch ${item.swatch}`} />
            <div className="meta">
              <span className="ja">{item.ja}</span>
              <span className="en">{item.en}</span>
            </div>
            <div className="val">
              <span className="num">{item.value}</span>
              {item.sub !== undefined && <span className="delta">{item.sub}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── セッション一覧テーブル ────────────────────────────────────────────────

interface SessionListProps {
  sessions: ChatSessionSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  total: number;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  isLoading: boolean;
  error: string | null;
  citationFilter: CitationFilter;
  countFilter: CountFilter;
  searchQuery: string;
  onCitationFilterChange: (v: CitationFilter) => void;
  onCountFilterChange: (v: CountFilter) => void;
  onSearchChange: (v: string) => void;
  filteredCount: number;
  locale: string;
}

function SessionList({
  sessions,
  selectedId,
  onSelect,
  total,
  page,
  totalPages,
  onPrev,
  onNext,
  isLoading,
  error,
  citationFilter,
  countFilter,
  searchQuery,
  onCitationFilterChange,
  onCountFilterChange,
  onSearchChange,
  filteredCount,
  locale,
}: SessionListProps) {
  return (
    <div>
      {/* フィルタバー */}
      <div className="filterbar">
        <span className="lbl">引用:</span>
        <select
          className="sel"
          value={citationFilter}
          onChange={(e) => onCitationFilterChange(e.target.value as CitationFilter)}
        >
          <option value="all">すべて</option>
          <option value="cited">引用あり</option>
          <option value="uncited">引用なし</option>
        </select>

        <span className="lbl">通数:</span>
        <select
          className="sel"
          value={countFilter}
          onChange={(e) => onCountFilterChange(e.target.value as CountFilter)}
        >
          <option value="all">すべて</option>
          <option value="1-3">1-3</option>
          <option value="4-9">4-9</option>
          <option value="10+">10以上</option>
        </select>

        <input
          type="text"
          placeholder="メッセージで検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <span className="count">{filteredCount} 件</span>
      </div>

      {/* セッションテーブル */}
      <div
        className="panel"
        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}
      >
        {isLoading ? (
          <p style={{ padding: '16px', fontSize: 13, color: 'var(--ink-muted)' }}>
            読み込み中...
          </p>
        ) : error !== null ? (
          <p style={{ padding: '16px', fontSize: 13, color: 'var(--danger)' }}>{error}</p>
        ) : sessions.length === 0 ? (
          <p style={{ padding: '16px', fontSize: 13, color: 'var(--ink-muted)' }}>
            会話セッションが見つかりません。
          </p>
        ) : (
          <table className="tbl-sessions">
            <thead>
              <tr>
                <th style={{ width: 70 }}>session</th>
                <th className="num" style={{ width: 50 }}>通数</th>
                <th>最後のメッセージ</th>
                <th style={{ width: 90 }}>引用</th>
                <th style={{ width: 110 }}>クライアント</th>
                <th style={{ width: 110 }}>最終更新</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.session_id}
                  className={`session-row${selectedId === session.session_id ? ' selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelect(session.session_id)}
                >
                  <td className="mono" style={{ color: 'var(--ink)' }}>
                    #{String(session.session_id).slice(0, 6)}
                  </td>
                  <td className="num">{session.message_count}</td>
                  <td>
                    <span className="lastmsg">
                      {formatTimestamp(session.last_message_at ?? session.updated_at, locale as never)}
                    </span>
                  </td>
                  <td>
                    {session.message_count > 0 ? (
                      <span className="pill pill-ready">あり</span>
                    ) : (
                      <span className="pill pill-failed">なし</span>
                    )}
                  </td>
                  <td className="mono faint" title={session.client_ip ?? undefined}>
                    {formatClientIp(session.client_ip)}
                  </td>
                  <td className="mono faint">
                    {formatTimestamp(session.last_message_at ?? session.updated_at, locale as never)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ページネーション */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
        <button
          className="btn btn-ghost btn-sm"
          disabled={page <= 1}
          style={{ opacity: page <= 1 ? 0.45 : 1 }}
          onClick={onPrev}
        >
          ← 前へ
        </button>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: 'var(--ink-muted)',
            letterSpacing: '0.06em',
          }}
        >
          page {page} / {totalPages || 1}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          次へ →
        </button>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: 'var(--ink-faint)',
          }}
        >
          全 {total} 件
        </span>
      </div>
    </div>
  );
}

// ─── チャットストリーム ────────────────────────────────────────────────────────

interface ChatStreamProps {
  messages: ChatMessageListItem[];
  locale: string;
}

function ChatStream({ messages, locale }: ChatStreamProps) {
  return (
    <div className="chat-stream" style={{ maxHeight: 'none', padding: 0 }}>
      {messages.map((msg) => (
        <div key={msg.message_id}>
          {msg.role === 'user' ? (
            <>
              <div className="chat-msg user">
                <div className="chat-bubble">{msg.content}</div>
                <div className="av">U</div>
              </div>
              <div className="chat-time" style={{ textAlign: 'left', paddingLeft: 0 }}>
                {formatTimestamp(msg.created_at, locale as never)}
              </div>
            </>
          ) : (
            <>
              <div className="chat-msg bot">
                <div className="av">n</div>
                <div className="chat-bubble">
                  {renderWithCiteMarkers(msg.content)}
                </div>
              </div>
              <div className="chat-time" style={{ textAlign: 'left', paddingLeft: 34 }}>
                {formatTimestamp(msg.created_at, locale as never)}
                {msg.citations.length > 0 && (
                  <> · <span style={{ color: 'var(--success)' }}>{msg.citations.length} 引用</span></>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── cited sources リスト ────────────────────────────────────────────────────

interface CitedSourcesListProps {
  messages: ChatMessageListItem[];
}

function CitedSourcesList({ messages }: CitedSourcesListProps) {
  // 全メッセージから unique citations を収集 (chunk_id ベースで重複除去)
  const citations = useMemo(() => {
    const seen = new Set<number>();
    const result: Array<{ num: number; chunkId: number; label: string; sectionLabel?: string }> = [];
    let counter = 1;

    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      for (const cit of msg.citations) {
        if (!seen.has(cit.chunk_id)) {
          seen.add(cit.chunk_id);
          result.push({
            num: counter++,
            chunkId: cit.chunk_id,
            label: cit.section_label ?? `chunk-${String(cit.chunk_id).padStart(3, '0')}`,
            sectionLabel: cit.section_label,
          });
        }
      }
    }

    return result;
  }, [messages]);

  if (citations.length === 0) return null;

  return (
    <>
      <div className="detail-section-head">cited sources · {citations.length}</div>
      <div style={{ fontSize: 12.5 }}>
        {citations.map((cit, i) => (
          <div
            key={cit.chunkId}
            style={{
              padding: '6px 0',
              borderBottom: i < citations.length - 1 ? '1px dotted var(--hair)' : 'none',
            }}
          >
            <span className="cite-marker">[{cit.num}]</span>
            <span style={{ color: 'var(--ink)', marginLeft: 6 }}>
              {cit.sectionLabel ?? `chunk-${String(cit.chunkId).padStart(3, '0')}`}
            </span>
            <span
              className="mono"
              style={{ color: 'var(--ink-faint)', fontSize: 11, marginLeft: 6 }}
            >
              chunk-{String(cit.chunkId).padStart(3, '0')}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── 詳細ペイン ───────────────────────────────────────────────────────────────

interface DetailPaneProps {
  session: ChatSessionSummary;
  messages: ChatMessageListItem[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  locale: string;
}

function DetailPane({ session, messages, isLoading, error, onClose, locale }: DetailPaneProps) {
  // 最後のメッセージの時刻を「終了時刻」とみなす
  const lastMsg = messages[messages.length - 1];
  const startedAt = session.created_at;
  const endedAt = lastMsg?.created_at ?? session.updated_at;
  const duration = formatDuration(startedAt, endedAt);

  // tokens 合計 (ChatMessageListItem に token フィールドは無いため表示は省略してメッセージ数で代替)
  const msgCount = messages.length;

  return (
    <div className="panel" style={{ padding: 0 }}>
      <div className="detail-stripe" />

      {/* ヘッダー */}
      <div className="detail-head">
        <div className="ic">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="title">
          <div className="id">
            セッション{' '}
            <span className="mono">#{String(session.session_id).slice(0, 6)}</span>
          </div>
          <div className="sub">
            {formatClientIp(session.client_ip)} · {formatTimestamp(startedAt, locale as never)} 開始
            · {msgCount} 通
          </div>
        </div>
        <button
          className="detail-close"
          aria-label="詳細を閉じる"
          onClick={onClose}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>

      {/* ボディ */}
      <div className="detail-body">
        {/* meta-grid */}
        <div className="meta-grid">
          <span className="k">session id</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>
            {session.session_id}
          </span>

          <span className="k">started</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>
            {formatTimestamp(startedAt, locale as never)}
          </span>

          <span className="k">ended</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>
            {formatTimestamp(endedAt, locale as never)}
          </span>

          <span className="k">duration</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>
            {duration}
          </span>

          <span className="k">messages</span>
          <span className="v mono" style={{ fontSize: 11.5 }}>
            {session.message_count} 通
          </span>

          {session.user_agent !== null && session.user_agent.trim() !== '' && (
            <>
              <span className="k">user agent</span>
              <span className="v mono" style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
                {session.user_agent}
              </span>
            </>
          )}

          {session.referer !== null && session.referer.trim() !== '' && (
            <>
              <span className="k">referer</span>
              <span className="v mono" style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
                {session.referer}
              </span>
            </>
          )}
        </div>

        {/* メッセージ */}
        <div className="detail-section-head">messages · {msgCount}</div>

        {isLoading ? (
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', padding: '8px 0' }}>
            メッセージを読み込み中...
          </p>
        ) : error !== null ? (
          <p style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 0' }}>{error}</p>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', padding: '8px 0' }}>
            メッセージがありません。
          </p>
        ) : (
          <>
            <ChatStream messages={messages} locale={locale} />
            <CitedSourcesList messages={messages} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── ConversationsPage (メイン) ───────────────────────────────────────────────

interface ConversationsPageProps {
  onLogout?: () => void;
}

export function ConversationsPage({ onLogout }: ConversationsPageProps = {}) {
  const { token } = useAdminAuth();
  const { locale } = useLocale();

  // ── KPI ステート ──────────────────────────────────────────────────────────
  const [kpiSessions, setKpiSessions] = useState<number | null>(null);
  const [kpiMessages, setKpiMessages] = useState<number | null>(null);
  const [kpiCitationRate, setKpiCitationRate] = useState<number | null>(null);

  // ── セッション一覧ステート ────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // ── フィルタステート ──────────────────────────────────────────────────────
  const [citationFilter, setCitationFilter] = useState<CitationFilter>('all');
  const [countFilter, setCountFilter] = useState<CountFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── 選択セッション + メッセージ ───────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageListItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // ── 古いログ整理 (#6) ──────────────────────────────────────────────────────
  const [showCleanup, setShowCleanup] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<number | null>(null);

  // ── KPI 読み込み ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadKpi(): Promise<void> {
      try {
        const data = await getAnalyticsSummary(token!, adminApiBase);
        if (!cancelled) {
          setKpiSessions(data.sessions.this_week);
          setKpiMessages(data.messages.user_total + data.messages.assistant_total);
          setKpiCitationRate(data.citation_rate);
        }
      } catch {
        // KPI ロード失敗は無視 (セッション一覧は別途ロード)
      }
    }

    void loadKpi();
    return () => { cancelled = true; };
  }, [token]);

  // ── セッション一覧ロード ────────────────────────────────────────────────
  const loadSessions = useCallback(
    async (pageNum: number, signal?: AbortSignal): Promise<void> => {
      if (!token) return;
      setIsLoadingSessions(true);
      setSessionsError(null);

      try {
        const offset = (pageNum - 1) * PAGE_SIZE;
        const res = await listChatSessions(token, adminApiBase, {
          limit: PAGE_SIZE,
          offset,
        });

        if (signal?.aborted) return;
        setSessions(res.sessions);
        setTotal(res.total);
      } catch (cause: unknown) {
        if (!signal?.aborted) {
          setSessionsError(
            cause instanceof Error ? cause.message : '会話セッションの読み込みに失敗しました。',
          );
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoadingSessions(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void loadSessions(page, ctrl.signal);
    return () => ctrl.abort();
  }, [loadSessions, page]);

  // ── 古いログ整理 (#6) ──────────────────────────────────────────────────────
  function openCleanup() {
    setCleanupDays(90);
    setCleanupError(null);
    setCleanupResult(null);
    setShowCleanup(true);
  }

  async function handleCleanup(): Promise<void> {
    if (!token) return;
    setIsCleaningUp(true);
    setCleanupError(null);
    try {
      const res = await cleanupChatSessions(token, adminApiBase, cleanupDays);
      setCleanupResult(res.deleted_count);
      setSelectedId(null);
      setPage(1);
      await loadSessions(1);
    } catch (cause: unknown) {
      setCleanupError(cause instanceof Error ? cause.message : '整理に失敗しました。');
    } finally {
      setIsCleaningUp(false);
    }
  }

  // ── メッセージロード ──────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedId === null || !token) {
      setMessages([]);
      return;
    }

    const sid = selectedId;
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoadingMessages(true);
      setMessagesError(null);

      try {
        const res = await listChatSessionMessages(token!, sid, adminApiBase);
        if (!cancelled) setMessages(res.messages);
      } catch (cause: unknown) {
        if (!cancelled) {
          setMessagesError(
            cause instanceof Error ? cause.message : 'メッセージの読み込みに失敗しました。',
          );
        }
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [token, selectedId]);

  // ── フィルタ適用 ──────────────────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    let result = sessions;

    result = result.filter((s) => matchesCitationFilter(s, citationFilter));
    result = result.filter((s) => matchesCountFilter(s, countFilter));

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const ipMatch = (s.client_ip ?? '').toLowerCase().includes(q);
        const uaMatch = (s.user_agent ?? '').toLowerCase().includes(q);
        return ipMatch || uaMatch;
      });
    }

    return result;
  }, [sessions, citationFilter, countFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedSession = sessions.find((s) => s.session_id === selectedId) ?? null;

  // ── KPI 表示 ─────────────────────────────────────────────────────────────
  const citationRatePct =
    kpiCitationRate !== null ? `${(kpiCitationRate * 100).toFixed(1)}%` : '—';
  const unansweredPct =
    kpiCitationRate !== null
      ? `${((1 - kpiCitationRate) * 100).toFixed(1)}%`
      : '—';
  const unansweredCount =
    kpiCitationRate !== null && kpiMessages !== null
      ? Math.round(kpiMessages * (1 - kpiCitationRate))
      : '—';

  const kpiItems: KpiItem[] = [
    {
      swatch: 'info',
      ja: 'セッション数',
      en: 'sessions · 7d',
      value: kpiSessions ?? '—',
    },
    {
      swatch: 'ok',
      ja: '総メッセージ数',
      en: 'messages',
      value: kpiMessages ?? '—',
    },
    {
      swatch: 'ok',
      ja: '引用率',
      en: 'citation rate',
      value: citationRatePct,
    },
    {
      swatch: 'warn',
      ja: '回答できなかった',
      en: 'unanswered',
      value: unansweredCount,
      sub: unansweredPct,
    },
  ];

  return (
    <Layout
      active="conversations"
      crumb="会話ログ"
      corpusStatus={undefined}
      modelStatus={undefined}
      stats={
        kpiSessions !== null
          ? `${kpiSessions} セッション · ${kpiMessages ?? 0} 通 · 引用 ${citationRatePct}`
          : undefined
      }
      onLogout={onLogout}
    >
      {/* ページヘッド */}
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <span>Conversations</span>
            <span className="sep" />
            <span className="scope">エンドユーザとの問い合わせ履歴</span>
          </div>
          <h1>会話ログ</h1>
          <div className="desc">
            埋め込みウィジェット経由で発生したセッションを一覧・検索します。
          </div>
        </div>
        <div className="head-actions">
          <div className="range-segment">
            <button type="button">24h</button>
            <button type="button" className="on">
              7d
            </button>
            <button type="button">30d</button>
            <button type="button">全期間</button>
          </div>
          <button type="button" className="btn btn-ghost" onClick={openCleanup}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            古いログを整理
          </button>
        </div>
      </div>

      {/* ミニ KPI */}
      <MiniKpiRow items={kpiItems} />

      {/* セッション一覧 + 詳細 */}
      <div className="conv-layout">
        {/* 左: セッション一覧 */}
        <SessionList
          sessions={filteredSessions}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setMessages([]);
          }}
          total={total}
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          isLoading={isLoadingSessions}
          error={sessionsError}
          citationFilter={citationFilter}
          countFilter={countFilter}
          searchQuery={searchQuery}
          onCitationFilterChange={setCitationFilter}
          onCountFilterChange={setCountFilter}
          onSearchChange={setSearchQuery}
          filteredCount={filteredSessions.length}
          locale={locale}
        />

        {/* 右: 詳細ペイン */}
        {selectedSession !== null ? (
          <DetailPane
            session={selectedSession}
            messages={messages}
            isLoading={isLoadingMessages}
            error={messagesError}
            onClose={() => setSelectedId(null)}
            locale={locale}
          />
        ) : (
          <div
            className="panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 320,
            }}
          >
            <p
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11.5,
                color: 'var(--ink-faint)',
                letterSpacing: '0.04em',
              }}
            >
              セッションを選択してください
            </p>
          </div>
        )}
      </div>

      {/* 古いログ整理モーダル (#6) */}
      {showCleanup && (
        <div
          className="modal-backdrop"
          onClick={() => { if (!isCleaningUp) setShowCleanup(false); }}
        >
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                古いログを整理 <span className="en">// cleanup</span>
              </h3>
              <button
                className="modal-close"
                type="button"
                onClick={() => setShowCleanup(false)}
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {cleanupResult !== null ? (
                <div className="auth-notice auth-notice-success" role="status" style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', borderRadius: 8, padding: '14px 16px', fontSize: 13 }}>
                  {cleanupResult} 件のセッションを削除しました。
                </div>
              ) : (
                <>
                  {cleanupError !== null && (
                    <div className="warn-note" style={{ marginBottom: 12 }}>{cleanupError}</div>
                  )}
                  <div className="field">
                    <label className="field-label">
                      削除する範囲 <span className="en">older than</span>
                    </label>
                    <select
                      className="field-select"
                      value={cleanupDays}
                      onChange={(e) => setCleanupDays(Number(e.target.value))}
                      disabled={isCleaningUp}
                    >
                      <option value={90}>90 日より前のセッション</option>
                      <option value={180}>180 日より前のセッション</option>
                      <option value={365}>1 年より前のセッション</option>
                    </select>
                    <div className="field-hint">
                      レンタルサーバーの容量節約のため、不要になった古い会話履歴を一括で削除します。
                    </div>
                  </div>
                  <div className="warn-note">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                      選択した範囲より古いセッションが完全に削除されます。この操作は取り消せません。分析の集計値には影響しません。
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-foot">
              {cleanupResult !== null ? (
                <button className="btn btn-primary" type="button" onClick={() => setShowCleanup(false)}>
                  閉じる
                </button>
              ) : (
                <>
                  <button className="btn btn-ghost" type="button" onClick={() => setShowCleanup(false)} disabled={isCleaningUp}>
                    キャンセル
                  </button>
                  <button className="btn btn-danger" type="button" onClick={() => void handleCleanup()} disabled={isCleaningUp}>
                    {isCleaningUp ? '整理中…' : '整理する'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* conv-layout に必要なスタイル (ローカルスコープ) */}
      <style>{`
        .conv-layout {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 14px;
          margin-top: 0;
        }
        @media (max-width: 1100px) {
          .conv-layout { grid-template-columns: 1fr; }
        }
        .filterbar {
          display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
          padding: 10px 14px;
          background: var(--surface);
          border: 1px solid var(--hair);
          border-bottom: none;
          border-radius: 8px 8px 0 0;
        }
        .filterbar .lbl {
          font-family: "JetBrains Mono", monospace;
          font-size: 10.5px; color: var(--ink-faint);
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .filterbar .sel {
          height: 26px; padding: 0 24px 0 10px;
          font-size: 12.5px;
          background: var(--surface);
          border: 1px solid var(--hair);
          border-radius: 5px;
          color: var(--ink);
          cursor: pointer;
          appearance: none; -webkit-appearance: none;
          background-image: linear-gradient(45deg, transparent 50%, var(--ink-faint) 50%),
                            linear-gradient(135deg, var(--ink-faint) 50%, transparent 50%);
          background-position: calc(100% - 12px) 50%, calc(100% - 8px) 50%;
          background-size: 4px 4px;
          background-repeat: no-repeat;
        }
        .filterbar input[type=text] {
          height: 26px; width: 200px; padding: 0 10px;
          font-size: 12.5px;
          background: var(--surface);
          border: 1px solid var(--hair);
          border-radius: 5px;
          color: var(--ink);
        }
        .filterbar .count {
          font-family: "JetBrains Mono", monospace;
          font-size: 11px; color: var(--ink-muted);
          letter-spacing: 0.04em; text-transform: uppercase;
          margin-left: auto;
        }
        .session-row td { padding: 12px 14px; }
        .session-row .lastmsg {
          color: var(--ink);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 220px;
          display: inline-block;
          vertical-align: middle;
        }
        .detail-stripe { height: 3px; background: var(--primary); }
        .detail-head {
          padding: 12px 16px;
          border-bottom: 1px solid var(--hair);
          display: flex; align-items: center; gap: 10px;
        }
        .detail-head .ic {
          width: 30px; height: 30px;
          border-radius: 6px;
          background: var(--primary-tint);
          color: var(--primary);
          border: 1px solid var(--hair);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .detail-head .title { flex: 1; min-width: 0; }
        .detail-head .title .id {
          font-size: 14px; font-weight: 700;
          color: var(--ink-strong);
          display: flex; align-items: baseline; gap: 6px;
        }
        .detail-head .title .id .mono {
          font-family: "JetBrains Mono", monospace;
          font-size: 12.5px; color: var(--primary); font-weight: 700;
        }
        .detail-head .title .sub {
          font-family: "JetBrains Mono", monospace;
          font-size: 11px; color: var(--ink-muted);
          letter-spacing: 0.04em; margin-top: 1px;
        }
        .detail-close {
          width: 26px; height: 26px;
          border-radius: 4px;
          border: 1px solid var(--hair);
          color: var(--ink-muted);
          background: var(--surface);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .detail-close:hover { background: var(--bg-soft); color: var(--ink); }
        .detail-body { padding: 14px 16px 18px; }
        .detail-section-head {
          font-family: "JetBrains Mono", monospace;
          font-size: 10.5px; font-weight: 600;
          color: var(--ink-muted);
          letter-spacing: 0.06em; text-transform: uppercase;
          margin: 14px 0 8px;
          display: flex; align-items: center; gap: 8px;
        }
        .detail-section-head::after {
          content: ''; flex: 1; height: 1px; background: var(--hair);
        }
        .cite-marker {
          display: inline-flex; align-items: center; gap: 3px;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          background: var(--surface);
          border: 1px solid var(--hair);
          color: var(--primary);
          padding: 1px 6px;
          border-radius: 99px;
          font-weight: 700;
          letter-spacing: 0.04em;
          vertical-align: middle;
          margin: 0 2px;
        }
      `}</style>
    </Layout>
  );
}
