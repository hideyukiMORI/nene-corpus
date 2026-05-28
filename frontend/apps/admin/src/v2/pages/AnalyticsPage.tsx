/**
 * AnalyticsPage — v2 分析ページ (#293)
 *
 * セクション:
 *  1. 詳細 KPI（sessions / messages / tokens / citation_rate / avg_messages_per_session）
 *     + 期間切替（24h / 7d / 30d / 全期間）
 *  2. 日別トレンド棒グラフ（最大 30 日）
 *  3. 時間帯別ヒートマップ（hourly_distribution 24 時間）
 *  4. Top questions テーブル（上位 20 件）
 *  5. CSV エクスポート（sessions / conversations、期間指定）
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getAnalyticsSummary,
  getTopQuestions,
  buildExportUrl,
  type AnalyticsSummaryResponse,
  type TopQuestion,
} from '@nene-corpus/api-client';
import { formatTimestamp, useLocale } from '@nene-corpus/i18n';
import { adminApiBase } from '../../config';
import { Layout } from '../Layout';

// ── Types ─────────────────────────────────────────────────────────────────────

type RangeKey = '24h' | '7d' | '30d' | 'all';

interface AnalyticsPageProps {
  token: string;
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

/** ISO date string → 短い表示 ("05-29") */
function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}`;
  } catch {
    return iso.slice(5, 10);
  }
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
}: {
  swatchVariant: 'ok' | 'info' | 'warn' | 'bad';
  labelJa: string;
  labelEn: string;
  value: string;
  unit?: string;
  accent?: boolean;
  delta?: string;
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
          <span className="delta">{delta}</span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsPage({ token }: AnalyticsPageProps) {
  const { locale } = useLocale();

  const [range, setRange] = useState<RangeKey>('7d');

  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [questions, setQuestions] = useState<TopQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CSV エクスポート日付入力
  const [exportFrom, setExportFrom] = useState(thirtyDaysAgoIso());
  const [exportTo, setExportTo] = useState(todayIso());

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryData, questionsData] = await Promise.all([
        getAnalyticsSummary(token, adminApiBase),
        getTopQuestions(token, adminApiBase, { limit: 20 }),
      ]);
      setSummary(summaryData);
      setQuestions(questionsData.questions);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const totalMessages =
    (summary?.messages.user_total ?? 0) + (summary?.messages.assistant_total ?? 0);
  const citationRate = summary?.citation_rate ?? 0;
  const totalSessions = summary?.sessions.total ?? 0;

  // ── Chart data: 日別トレンド（過去 30 日） ──────────────────────────────────

  /** 過去 N 日分の日付ラベル配列を生成 */
  function buildDateRange(days: number): string[] {
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }

  const chartDays = 30;
  const dateRange = buildDateRange(chartDays);
  const dailyMap = new Map<string, number>(
    (summary?.daily_trend ?? []).map((d) => [d.date, d.sessions]),
  );
  const chartData = dateRange.map((date) => ({
    date,
    sessions: dailyMap.get(date) ?? 0,
  }));
  const chartMax = Math.max(...chartData.map((d) => d.sessions), 1);

  const todayIsoStr = new Date().toISOString().slice(0, 10);
  const yesterdayIsoStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const DAY_LABELS_JA = ['日', '月', '火', '水', '木', '金', '土'];
  function barLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const dayJa = DAY_LABELS_JA[d.getDay()] ?? '';
    return `${dayJa} ${String(d.getDate())}`;
  }

  // ── Chart data: 時間帯別分布 ────────────────────────────────────────────────

  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    sessions: 0,
  }));
  for (const h of (summary?.hourly_distribution ?? [])) {
    const slot = hourlyData[h.hour];
    if (slot !== undefined) slot.sessions = h.sessions;
  }
  const hourlyMax = Math.max(...hourlyData.map((h) => h.sessions), 1);

  // ── Range label ─────────────────────────────────────────────────────────────
  const rangeLabel: Record<RangeKey, string> = {
    '24h': '過去 24 時間',
    '7d': '過去 7 日間',
    '30d': '過去 30 日間',
    all: '全期間',
  };

  // ── CSV エクスポート ─────────────────────────────────────────────────────────
  // JWT が必要なので fetch + createObjectURL を使う
  const downloadExport = useCallback(
    async (format: 'sessions' | 'conversations') => {
      try {
        const url = buildExportUrl(
          adminApiBase,
          format,
          exportFrom || undefined,
          exportTo || undefined,
        );
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

        if (!res.ok) {
          throw new Error(`HTTP ${String(res.status)}`);
        }

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const disposition = res.headers.get('Content-Disposition') ?? '';
        const match = /filename="([^"]+)"/.exec(disposition);
        a.href = objectUrl;
        a.download = match?.[1] ?? `nene-corpus-${format}.csv`;
        a.click();
        URL.revokeObjectURL(objectUrl);
      } catch (cause: unknown) {
        // eslint-disable-next-line no-alert
        alert(cause instanceof Error ? cause.message : 'エクスポートに失敗しました');
      }
    },
    [token, exportFrom, exportTo],
  );

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (!isLoading && error !== null) {
    return (
      <Layout active="analytics" crumb="分析">
        <div className="page-head">
          <div>
            <div className="eyebrow"><span>Analytics</span></div>
            <h1>分析</h1>
          </div>
        </div>
        <div className="alert">
          <div className="alert-icon">!</div>
          <div className="alert-body">
            <div className="alert-title">データの読み込みに失敗しました</div>
            <div className="alert-desc">{error}</div>
          </div>
          <button type="button" className="alert-cta" onClick={() => { void load(); }}>
            再試行 →
          </button>
        </div>
      </Layout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Layout active="analytics" crumb="分析">
      {/* ── Page head ──────────────────────────────────────────────────── */}
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <span>Analytics</span>
            <span className="sep" />
            <span className="scope">{rangeLabel[range]}</span>
          </div>
          <h1>分析</h1>
          <div className="desc">チャットの利用状況・トークン消費・よく聞かれる質問を確認できます。</div>
        </div>
        <div className="head-actions">
          {/* 期間切替 // range selector */}
          <div className="range-segment">
            {(['24h', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={range === r ? 'on' : undefined}
                onClick={() => { setRange(r); }}
              >
                {r === 'all' ? '全期間' : r}
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
        </div>
      </div>

      {/* ── Section 1: 詳細 KPI // detailed KPI rows ───────────────────── */}
      <SectionHead
        num="01"
        title="利用統計"
        en="// KPI"
        right={rangeLabel[range]}
      />
      <div className="kpi-block">
        <div className="kpi-grid">
          <KpiRow
            swatchVariant="info"
            labelJa="セッション数（本日）"
            labelEn="sessions / today"
            value={isLoading ? '—' : String(summary?.sessions.today ?? 0)}
            accent
            delta={
              summary !== null
                ? `今週 ${String(summary.sessions.this_week)} · 累計 ${String(summary.sessions.total)}`
                : undefined
            }
          />
          <KpiRow
            swatchVariant="info"
            labelJa="セッション数（合計）"
            labelEn="sessions / total"
            value={isLoading ? '—' : String(totalSessions)}
            delta={
              summary !== null && summary.avg_messages_per_session > 0
                ? `平均 ${summary.avg_messages_per_session.toFixed(1)} 通 / セッション`
                : undefined
            }
          />
          <KpiRow
            swatchVariant="ok"
            labelJa="メッセージ数（ユーザー）"
            labelEn="messages / user"
            value={isLoading ? '—' : String(summary?.messages.user_total ?? 0)}
            delta={
              summary !== null
                ? `AI 回答 ${String(summary.messages.assistant_total)}`
                : undefined
            }
          />
          <KpiRow
            swatchVariant="ok"
            labelJa="引用付き回答率"
            labelEn="citation rate"
            value={isLoading ? '—' : formatPercent(citationRate).replace('%', '')}
            unit="%"
            delta="— (目標 85%)"
          />
          <KpiRow
            swatchVariant="warn"
            labelJa="入力トークン"
            labelEn="tokens / input"
            value={isLoading ? '—' : formatTokens(summary?.tokens.input_total ?? 0)}
          />
          <KpiRow
            swatchVariant="warn"
            labelJa="出力トークン"
            labelEn="tokens / output"
            value={isLoading ? '—' : formatTokens(summary?.tokens.output_total ?? 0)}
            delta={
              summary !== null
                ? `合計 ${formatTokens(summary.tokens.input_total + summary.tokens.output_total)}`
                : undefined
            }
          />
        </div>
      </div>

      {/* ── Section 2: 日別トレンド棒グラフ // daily sessions bar chart ─── */}
      <SectionHead
        num="02"
        title="日別セッション数"
        en="// daily sessions"
        right="30 days"
      />
      <div className="chart">
        <div className="bars">
          {chartData.map((d) => {
            const isPeak = d.date === todayIsoStr || d.date === yesterdayIsoStr;
            const isDim = new Date(d.date) < new Date(yesterdayIsoStr);
            const colClass = isPeak ? 'col peak' : isDim ? 'col dim' : 'col';
            const heightPx = Math.max(
              Math.round((d.sessions / chartMax) * 96),
              d.sessions > 0 ? 4 : 0,
            );
            return (
              <div key={d.date} className="bar">
                <span className="num">{d.sessions > 0 ? d.sessions : ''}</span>
                <div className={colClass} style={{ height: `${heightPx}px` }} />
                <span className="lbl">{barLabel(d.date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: 時間帯別ヒートマップ // hourly distribution ────────── */}
      <SectionHead
        num="03"
        title="時間帯別セッション数"
        en="// hourly distribution"
      />
      <div className="chart">
        <div className="bars">
          {hourlyData.map((h) => {
            const heightPx = Math.max(
              Math.round((h.sessions / hourlyMax) * 96),
              h.sessions > 0 ? 4 : 0,
            );
            return (
              <div key={h.hour} className="bar">
                <span className="num">{h.sessions > 0 ? h.sessions : ''}</span>
                <div className="col" style={{ height: `${heightPx}px` }} />
                <span className="lbl">{String(h.hour).padStart(2, '0')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Top questions テーブル ───────────────────────────── */}
      <SectionHead
        num="04"
        title="よく聞かれた質問"
        en="// top questions"
        right="top 20"
      />
      <div className="panel">
        {isLoading ? (
          <div style={{ padding: '20px 16px', color: 'var(--ink-faint)', fontSize: 13 }}>
            読み込み中...
          </div>
        ) : questions.length === 0 ? (
          <div style={{ padding: '20px 16px', color: 'var(--ink-faint)', fontSize: 13 }}>
            質問データがありません
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th>質問内容 // question</th>
                <th className="num" style={{ width: 72 }}>件数 // count</th>
                <th style={{ width: 140 }}>最終 // last asked</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={`${q.content}-${String(i)}`}>
                  <td className="mono faint">{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ maxWidth: 480, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.content}
                  </td>
                  <td className="num" style={{ color: 'var(--accent-blue, #3B82F6)', fontWeight: 600 }}>
                    {q.count}
                  </td>
                  <td className="mono faint">
                    {formatTimestamp(q.last_asked_at, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Section 5: CSV エクスポート // CSV export ────────────────────── */}
      <SectionHead
        num="05"
        title="CSV エクスポート"
        en="// export"
      />
      <div className="panel">
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 期間入力 // date range inputs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--ink-muted)' }}>
              開始日 // from
              <input
                type="date"
                value={exportFrom}
                max={exportTo}
                onChange={(e) => { setExportFrom(e.target.value); }}
                style={{
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  padding: '4px 8px',
                  fontSize: 13,
                  color: 'var(--ink)',
                  background: 'var(--surface)',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--ink-muted)' }}>
              終了日 // to
              <input
                type="date"
                value={exportTo}
                min={exportFrom}
                max={todayIso()}
                onChange={(e) => { setExportTo(e.target.value); }}
                style={{
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  padding: '4px 8px',
                  fontSize: 13,
                  color: 'var(--ink)',
                  background: 'var(--surface)',
                }}
              />
            </label>
          </div>
          {/* ダウンロードボタン // download buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { void downloadExport('sessions'); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              sessions エクスポート
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { void downloadExport('conversations'); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              conversations エクスポート
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: 0 }}>
            ※ ダウンロードには認証トークンを使用します。JWT は有効期限内にご利用ください。
          </p>
        </div>
      </div>
    </Layout>
  );
}
