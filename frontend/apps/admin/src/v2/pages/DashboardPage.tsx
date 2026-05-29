/**
 * DashboardPage — v2 実装 (#261)
 *
 * セクション:
 *  1. LLM 未設定の警告バナー
 *  2. 運用ステータス (KPI 6 つ)
 *  3. 日別セッション数 棒グラフ
 *  4. ソース一覧 + よく聞かれる質問 (2 col)
 *  5. 直近の会話 (テーブル)
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getLlmSettings,
  listSources,
  listChatSessions,
  getAnalyticsSummary,
  getTopQuestions,
  type AnalyticsSummaryResponse,
  type TopQuestion,
  type SourceListItem,
  type ChatSessionSummary,
} from '@nene-corpus/api-client';
import { adminApiBase } from '../../config';
import { Layout } from '../Layout';
import { useNavigate } from '../router';

// ── Types ─────────────────────────────────────────────────────────────────────

type RangeKey = '24h' | '7d' | '30d';

interface DashboardPageProps {
  token: string;
  onLogout?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/** ISO date string → 短い表示 ("05-29 12:10") */
function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return iso.slice(0, 16);
  }
}

/** ISO date string → "本日 HH:MM" or "MM/DD HH:MM" */
function formatSessionTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    if (isToday) return `本日 ${hh}:${mi}`;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${mi}`;
  } catch {
    return iso.slice(0, 16);
  }
}

/** セッション ID の末尾 4 文字を取得 (表示用) */
function sessionShortId(id: number): string {
  return `#${id.toString(16).slice(-4).padStart(4, '0')}`;
}

/** チャート用: 過去 N 日分の日付ラベル配列を生成 */
function buildDateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** source_type → タイプタグ CSS クラス */
function typeTagClass(type: SourceListItem['source_type']): string {
  if (type === 'csv') return 'csv';
  if (type === 'pdf') return 'pdf';
  return 'text';
}

/** source_type → 表示ラベル */
function typeLabel(type: SourceListItem['source_type']): string {
  if (type === 'csv') return 'csv';
  if (type === 'pdf') return 'pdf';
  return 'txt';
}

/** source.status → pill class + ラベル */
function sourcePillClass(status: SourceListItem['status']): string {
  if (status === 'ready') return 'pill pill-ready';
  if (status === 'processing' || status === 'pending') return 'pill pill-processing';
  return 'pill pill-failed';
}

function sourcePillLabel(status: SourceListItem['status']): string {
  if (status === 'ready') return '取り込み済み';
  if (status === 'processing') return '取り込み中';
  if (status === 'pending') return '待機中';
  return 'エラー';
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** セクション見出し */
function SectionHead({
  num,
  title,
  en,
  right,
}: {
  num: string;
  title: string;
  en: string;
  right?: string;
}) {
  return (
    <div className="section-head">
      <span className="num">{num}</span>
      <h2>{title}</h2>
      <span className="en">{en}</span>
      <span className="rule" />
      {right !== undefined && (
        <span className="right">{right}</span>
      )}
    </div>
  );
}

/** KPI 行 */
function KpiRow({
  swatchVariant,
  labelJa,
  labelEn,
  value,
  unit,
  accent,
  delta,
  deltaUp,
}: {
  swatchVariant: 'ok' | 'info' | 'warn' | 'bad';
  labelJa: string;
  labelEn: string;
  value: string;
  unit?: string;
  accent?: boolean;
  delta?: string;
  deltaUp?: boolean;
}) {
  return (
    <div className="kpi-row">
      <span className={`swatch ${swatchVariant}`} />
      <div className="meta">
        <span className="ja">{labelJa}</span>
        <span className="en">{labelEn}</span>
      </div>
      <div className="val">
        <span className={`num${accent === true ? ' accent' : ''}`}>
          {value}
          {unit !== undefined && <span className="unit">{unit}</span>}
        </span>
        {delta !== undefined && (
          <span className={`delta${deltaUp === true ? ' up' : ''}`}>{delta}</span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardPage({ token, onLogout }: DashboardPageProps) {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>('7d');

  // ── API state ──────────────────────────────────────────────────────────────
  const [isLlmConfigured, setIsLlmConfigured] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [questions, setQuestions] = useState<TopQuestion[]>([]);
  const [sources, setSources] = useState<SourceListItem[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [llm, summaryData, questionsData, sourcesData, sessionsData] = await Promise.allSettled([
        getLlmSettings(token, adminApiBase),
        getAnalyticsSummary(token, adminApiBase),
        getTopQuestions(token, adminApiBase, { limit: 5 }),
        listSources(token, adminApiBase, { limit: 7 }),
        listChatSessions(token, adminApiBase, { limit: 10 }),
      ]);

      if (llm.status === 'fulfilled') {
        setIsLlmConfigured(llm.value.configured);
      }
      if (summaryData.status === 'fulfilled') {
        setSummary(summaryData.value);
      }
      if (questionsData.status === 'fulfilled') {
        setQuestions(questionsData.value.questions);
      }
      if (sourcesData.status === 'fulfilled') {
        setSources(sourcesData.value.sources);
      }
      if (sessionsData.status === 'fulfilled') {
        setSessions(sessionsData.value.sessions);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const totalSessions = summary?.sessions.this_week ?? 0;
  const totalMessages = (summary?.messages.user_total ?? 0) + (summary?.messages.assistant_total ?? 0);
  const citationRate = summary?.citation_rate ?? 0;

  const readySources = sources.filter((s) => s.status === 'ready').length;
  const totalSourcesCount = sources.length;
  const totalChunks = sources.reduce((acc, s) => acc + s.chunk_count, 0);

  // corpusStatus: "X / Y 取り込み済み"
  const corpusStatus =
    totalSourcesCount > 0
      ? `${readySources} / ${totalSourcesCount} 取り込み済み`
      : undefined;

  const statsLabel =
    summary !== null
      ? `${totalSessions} セッション · ${totalMessages} 通 · 引用 ${formatPercent(citationRate)}`
      : undefined;

  // ── Chart data ─────────────────────────────────────────────────────────────

  const chartDays = range === '24h' ? 1 : range === '7d' ? 7 : 30;
  const dateRange = buildDateRange(chartDays);

  // daily_trend から日付をキーにしたマップ
  const dailyMap = new Map<string, number>(
    (summary?.daily_trend ?? []).map((d) => [d.date, d.sessions]),
  );

  // チャート用データ: 日付 + セッション数
  const chartData = dateRange.map((date) => ({
    date,
    sessions: dailyMap.get(date) ?? 0,
  }));

  const chartMax = Math.max(...chartData.map((d) => d.sessions), 1);

  // 当日・前日のインデックス (peak ハイライト)
  const todayIso = new Date().toISOString().slice(0, 10);
  const yesterdayIso = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // 短いラベル: "金 22" のような形式
  const DAY_LABELS_JA = ['日', '月', '火', '水', '木', '金', '土'];
  function barLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const dayJa = DAY_LABELS_JA[d.getDay()] ?? '';
    return `${dayJa} ${String(d.getDate())}`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Layout
      active="dashboard"
      crumb="ダッシュボード"
      corpusStatus={corpusStatus ?? '読み込み中...'}
      modelStatus={isLlmConfigured ? 'ok' : 'bad'}
      stats={statsLabel}
      onLogout={onLogout}
    >
      {/* ── Page head ──────────────────────────────────────────────────── */}
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <span>Dashboard</span>
            <span className="sep" />
            <span className="scope">
              {range === '24h' && '過去 24 時間の概要'}
              {range === '7d' && '過去 7 日間の概要'}
              {range === '30d' && '過去 30 日間の概要'}
            </span>
          </div>
          <h1>ダッシュボード</h1>
          <div className="desc">コーパスの取り込み状況と、直近の会話ログを一覧します。</div>
        </div>
        <div className="head-actions">
          {/* 期間切替 // range selector */}
          <div className="range-segment">
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                className={range === r ? 'on' : undefined}
                type="button"
                onClick={() => { setRange(r); }}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { void load(); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            再読み込み
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { navigate('/sources'); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            ソースを追加
          </button>
        </div>
      </div>

      {/* ── Section 1: LLM 未設定バナー // llm-unconfigured alert ────── */}
      {!isLoading && !isLlmConfigured && (
        <div className="alert">
          <div className="alert-icon">!</div>
          <div className="alert-body">
            <div className="alert-title">チャット機能が無効になっています</div>
            <div className="alert-desc">
              「モデル」設定で Anthropic API キーを登録すると、サイトの埋め込みウィジェットからの問い合わせに回答できるようになります。
            </div>
          </div>
          <button
            type="button"
            className="alert-cta"
            onClick={() => { navigate('/settings'); }}
          >
            モデルを設定する →
          </button>
        </div>
      )}

      {/* ── Section 2: 運用ステータス // KPI rows ─────────────────────── */}
      <SectionHead
        num="01"
        title="運用ステータス"
        en="// holdings"
        right={range === '7d' ? '7 days' : range === '24h' ? 'last 24h' : '30 days'}
      />
      <div className="kpi-block">
        <div className="kpi-grid">
          <KpiRow
            swatchVariant="ok"
            labelJa="取り込み済みソース"
            labelEn="sources / indexed"
            value={String(readySources)}
            unit={`/ ${totalSourcesCount}`}
            delta={
              sources.some((s) => s.status === 'processing' || s.status === 'pending')
                ? `${sources.filter((s) => s.status === 'processing' || s.status === 'pending').length} 取り込み中`
                : undefined
            }
          />
          <KpiRow
            swatchVariant="ok"
            labelJa="チャンク総数"
            labelEn="chunks / total"
            value={String(totalChunks)}
            delta={
              readySources > 0
                ? `平均 ${Math.round(totalChunks / Math.max(readySources, 1))} / ソース`
                : undefined
            }
          />
          <KpiRow
            swatchVariant="info"
            labelJa="会話セッション"
            labelEn={`sessions / ${range}`}
            value={String(summary?.sessions.this_week ?? 0)}
            accent={true}
            // TODO: API 実装後に前週比を差し替え
            delta="— (前週比)"
          />
          <KpiRow
            swatchVariant="info"
            labelJa="メッセージ数"
            labelEn={`messages / ${range}`}
            value={String(totalMessages)}
            delta={
              totalSessions > 0
                ? `${(totalMessages / Math.max(totalSessions, 1)).toFixed(1)} 通 / セッション`
                : undefined
            }
          />
          <KpiRow
            swatchVariant="ok"
            labelJa="引用付き回答率"
            labelEn="citation rate"
            value={formatPercent(citationRate).replace('%', '')}
            unit="%"
            delta="— (目標 85%)"
          />
          <KpiRow
            swatchVariant="warn"
            labelJa="トークン消費量"
            labelEn={`tokens / ${range}`}
            value={formatTokens(
              (summary?.tokens.input_total ?? 0) + (summary?.tokens.output_total ?? 0),
            )}
            delta={
              summary !== null
                ? `入 ${formatTokens(summary.tokens.input_total)} · 出 ${formatTokens(summary.tokens.output_total)}`
                : undefined
            }
          />
        </div>
      </div>

      {/* ── Section 3: 日別セッション数 // daily sessions bar chart ───── */}
      <SectionHead
        num="02"
        title="日別セッション数"
        en="// daily sessions"
        right={`${chartDays === 1 ? '24h' : chartDays === 7 ? '7 days' : '30 days'}`}
      />
      <div className="chart">
        <div className="bars">
          {chartData.map((d) => {
            const isPeak = d.date === todayIso || d.date === yesterdayIso;
            const isDim = new Date(d.date) < new Date(yesterdayIso);
            const colClass = isPeak ? 'col peak' : isDim ? 'col dim' : 'col';
            const heightPx = Math.max(Math.round((d.sessions / chartMax) * 96), d.sessions > 0 ? 4 : 0);
            return (
              <div key={d.date} className="bar">
                <span className="num">{d.sessions}</span>
                <div className={colClass} style={{ height: `${heightPx}px` }} />
                <span className="lbl">{barLabel(d.date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: 2-col ソース一覧 + よく聞かれる質問 ─────────────── */}
      <div className="two-col">
        {/* ソース一覧 // sources panel */}
        <div className="panel">
          <div className="panel-head">
            <div className="title">
              ソース一覧 <span className="en">sources</span>
            </div>
            <button
              type="button"
              className="panel-link"
              onClick={() => { navigate('/sources'); }}
            >
              manage →
            </button>
          </div>
          <table className="tbl-src-mini">
            <thead>
              <tr>
                <th>名前</th>
                <th style={{ width: 60 }}>種別</th>
                <th style={{ width: 110 }}>状態</th>
                <th className="num" style={{ width: 70 }}>チャンク</th>
                <th style={{ width: 100 }}>更新</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: '20px 0' }}>
                    ソースがありません
                  </td>
                </tr>
              )}
              {sources.slice(0, 7).map((s) => (
                <tr
                  key={s.source_id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => { navigate('/sources'); }}
                >
                  <td>{s.name}</td>
                  <td>
                    <span className={`type-tag ${typeTagClass(s.source_type)}`}>
                      {typeLabel(s.source_type)}
                    </span>
                  </td>
                  <td>
                    <span className={sourcePillClass(s.status)}>
                      {sourcePillLabel(s.status)}
                    </span>
                  </td>
                  <td className="num">
                    {s.chunk_count > 0 ? s.chunk_count : <span className="faint">—</span>}
                  </td>
                  <td className="mono faint">{formatDateShort(s.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* よく聞かれる質問 // top questions panel */}
        <div className="panel">
          <div className="panel-head">
            <div className="title">
              よく聞かれる質問 <span className="en">top queries · {range}</span>
            </div>
            <button
              type="button"
              className="panel-link"
              onClick={() => { navigate('/conversations'); }}
            >
              all →
            </button>
          </div>
          <div className="q-list">
            {questions.length === 0 && !isLoading && (
              <div style={{ padding: '20px 16px', color: 'var(--ink-faint)', fontSize: 13 }}>
                データがありません
              </div>
            )}
            {questions.slice(0, 5).map((q, i) => {
              const maxCount = questions[0]?.count ?? 1;
              const fillPct = Math.round((q.count / Math.max(maxCount, 1)) * 100);
              return (
                <div key={`${q.content}-${String(i)}`} className="q">
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text">{q.content}</span>
                  <span className="bar">
                    <span className="fill" style={{ width: `${fillPct}%` }} />
                  </span>
                  <span className="c">{q.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 5: 直近の会話 // recent conversations table ─────────── */}
      <SectionHead
        num="03"
        title="直近の会話"
        en="// recent conversations"
        right="last 24h"
      />
      <div className="panel">
        <table className="tbl-recent">
          <thead>
            <tr>
              <th style={{ width: 70 }}>セッション</th>
              <th className="num" style={{ width: 70 }}>通数</th>
              <th>最後のメッセージ</th>
              <th style={{ width: 130 }}>クライアント</th>
              <th style={{ width: 130 }}>最終更新</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: '20px 0' }}>
                  会話ログがありません
                </td>
              </tr>
            )}
            {sessions.slice(0, 10).map((s) => (
              <tr key={s.session_id}>
                <td className="mono" style={{ color: 'var(--ink)' }}>
                  {sessionShortId(s.session_id)}
                </td>
                <td className="num">{s.message_count}</td>
                <td style={{ color: 'var(--ink-soft)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {/* TODO: API 実装後に最後のメッセージ本文を差し替え */}
                  {/* last_message は未提供のため session の更新時刻で代替 */}
                  <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>—</span>
                </td>
                <td className="mono faint">{s.client_ip ?? '—'}</td>
                <td className="mono faint">
                  {formatSessionTime(s.last_message_at ?? s.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
