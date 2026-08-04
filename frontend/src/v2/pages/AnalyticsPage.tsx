/**
 * AnalyticsPage — v2 実装 (#293 / SPEC §5.6)
 *
 * セクション:
 *  01 サマリー KPI（利用可能な指標のみ）
 *  02 会話数の推移（daily_trend 棒グラフ）
 *  03 質問ランキング + 回答の内訳ドーナツ
 *
 * 注: SPEC の「平均応答時間 / p95 / 未回答件数」は現状メタデータが無いため省略（§9）。
 */
import { useCallback, useEffect, useState } from 'react';
import {
  getAnalyticsSummary,
  getTopQuestions,
  buildExportPath,
  createAdminTransport,
  type AnalyticsSummaryResponse,
  type TopQuestion,
} from '@/shared/api';
import { adminApiBase } from '../../config';
import { Layout } from '../Layout';
import { useNavigate } from '../router';

type RangeKey = '7d' | '30d' | '90d';

interface AnalyticsPageProps {
  token: string;
  onLogout?: () => void;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatInt(n: number): string {
  return n.toLocaleString('en-US');
}

const DAY_LABELS_JA = ['日', '月', '火', '水', '木', '金', '土'];

function SectionHead({ num, title, en, right }: { num: string; title: string; en: string; right?: string }) {
  return (
    <div className="section-head">
      <span className="num">{num}</span>
      <h2>{title}</h2>
      <span className="en">{en}</span>
      <span className="rule" />
      {right !== undefined && <span className="right">{right}</span>}
    </div>
  );
}

function KpiRow({
  swatch, labelJa, labelEn, value, unit, accent, success, delta,
}: {
  swatch: 'ok' | 'info' | 'warn';
  labelJa: string; labelEn: string; value: string; unit?: string;
  accent?: boolean; success?: boolean; delta?: string;
}) {
  const numClass = `num${accent === true ? ' accent' : ''}${success === true ? ' success' : ''}`;
  return (
    <div className="kpi-row">
      <span className={`swatch ${swatch}`} />
      <div className="meta">
        <span className="ja">{labelJa}</span>
        <span className="en">{labelEn}</span>
      </div>
      <div className="val">
        <span className={numClass}>
          {value}
          {unit !== undefined && <span className="unit">{unit}</span>}
        </span>
        {delta !== undefined && <span className="delta">{delta}</span>}
      </div>
    </div>
  );
}

export function AnalyticsPage({ token, onLogout }: AnalyticsPageProps) {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>('30d');
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [questions, setQuestions] = useState<TopQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, questionsData] = await Promise.allSettled([
        getAnalyticsSummary(token, adminApiBase),
        getTopQuestions(token, adminApiBase, { limit: 7 }),
      ]);
      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      if (questionsData.status === 'fulfilled') setQuestions(questionsData.value.questions);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function handleExport(format: 'sessions' | 'conversations'): Promise<void> {
    setIsExporting(true);
    try {
      const transport = createAdminTransport(token, adminApiBase);
      const { blob, filename } = await transport.getBlob(buildExportPath(format));
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename ?? `nene-corpus-${format}.csv`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // 失敗は握りつぶし（ボタンは復帰）
    } finally {
      setIsExporting(false);
    }
  }

  // ── 派生値 ────────────────────────────────────────────────────────────────
  const totalSessions = summary?.sessions.this_week ?? 0;
  const totalMessages = (summary?.messages.user_total ?? 0) + (summary?.messages.assistant_total ?? 0);
  const citationRate = summary?.citation_rate ?? 0;
  const citationPct = (citationRate * 100).toFixed(1);
  const inputTokens = summary?.tokens.input_total ?? 0;
  const outputTokens = summary?.tokens.output_total ?? 0;
  const avgMsg = summary?.avg_messages_per_session ?? 0;

  // チャート: daily_trend の末尾 N 日
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const trend = (summary?.daily_trend ?? []).slice(-days);
  const trendMax = Math.max(...trend.map((d) => d.sessions), 1);

  function barLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return `${DAY_LABELS_JA[d.getDay()] ?? ''} ${String(d.getDate())}`;
  }

  // ドーナツ: 引用付き vs それ以外（未回答メタデータが無いため 2 分割）
  const citedDash = Math.max(0, Math.min(100, citationRate * 100));

  return (
    <Layout
      active="analytics"
      crumb="分析"
      corpusStatus={undefined}
      modelStatus={undefined}
      stats={summary !== null ? `${totalSessions} セッション · ${totalMessages} 通 · 引用 ${citationPct}%` : undefined}
      onLogout={onLogout}
    >
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <span>Analytics</span>
            <span className="sep" />
            <span className="scope">会話の傾向と品質</span>
          </div>
          <h1>分析</h1>
          <div className="desc">エンドユーザの質問内容と、回答の品質を集計します。</div>
        </div>
        <div className="head-actions">
          <div className="range-segment">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={range === r ? 'on' : undefined}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={isExporting}
            onClick={() => void handleExport('conversations')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isExporting ? 'エクスポート中…' : 'CSV エクスポート'}
          </button>
        </div>
      </div>

      {/* 01 サマリー */}
      <SectionHead num="01" title="サマリー" en="// summary" right={`直近 ${days} 日`} />
      <div className="kpi-block">
        <div className="kpi-grid">
          <KpiRow swatch="info" labelJa="会話セッション" labelEn="sessions" value={formatInt(totalSessions)} accent />
          <KpiRow swatch="ok" labelJa="総メッセージ数" labelEn="messages" value={formatInt(totalMessages)} delta={`${avgMsg.toFixed(1)} / セッション`} />
          <KpiRow swatch="ok" labelJa="引用付き回答率" labelEn="cited answers" value={citationPct} unit="%" success />
          <KpiRow swatch="warn" labelJa="トークン消費量" labelEn="tokens" value={formatTokens(inputTokens + outputTokens)} delta={`入 ${formatTokens(inputTokens)} · 出 ${formatTokens(outputTokens)}`} />
        </div>
      </div>

      {/* 02 会話数の推移 */}
      <SectionHead num="02" title="会話数の推移" en="// daily sessions" right={`${days} days`} />
      <div className="chart">
        {trend.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', padding: '8px 0' }}>
            {isLoading ? '読み込み中…' : 'データがありません。'}
          </p>
        ) : (
          <div className="bars" style={{ height: 150, gap: trend.length > 14 ? 3 : 8 }}>
            {trend.map((d) => {
              const isPeak = d.sessions === trendMax && trendMax > 0;
              const isDim = d.sessions < trendMax * 0.5;
              const heightPx = Math.max(Math.round((d.sessions / trendMax) * 130), d.sessions > 0 ? 4 : 0);
              return (
                <div key={d.date} className="bar" title={`${d.date}: ${String(d.sessions)} セッション`}>
                  {trend.length <= 14 && <span className="num">{d.sessions}</span>}
                  <div className={isPeak ? 'col peak' : isDim ? 'col dim' : 'col'} style={{ height: heightPx }} />
                  {trend.length <= 14 && <span className="lbl">{barLabel(d.date)}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 03 質問ランキング + 回答の内訳 */}
      <div className="two-col" style={{ marginTop: 20 }}>
        <div className="panel">
          <div className="panel-head">
            <div className="title">質問ランキング <span className="en">top questions</span></div>
          </div>
          <div className="q-list">
            {questions.length === 0 && !isLoading && (
              <div style={{ padding: '20px 16px', color: 'var(--ink-faint)', fontSize: 13 }}>データがありません。</div>
            )}
            {questions.map((q, i) => {
              const maxCount = questions[0]?.count ?? 1;
              const fillPct = Math.round((q.count / Math.max(maxCount, 1)) * 100);
              return (
                <div key={`${q.content}-${String(i)}`} className="q">
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text">{q.content}</span>
                  <span className="bar"><span className="fill" style={{ width: `${fillPct}%` }} /></span>
                  <span className="c">{q.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="title">回答の内訳 <span className="en">answer quality</span></div>
          </div>
          <div style={{ padding: '22px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <div style={{ width: 132, height: 132, flexShrink: 0, position: 'relative' }}>
                <svg viewBox="0 0 36 36" width="132" height="132">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--hair)" strokeWidth="4" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" stroke="var(--success)" strokeWidth="4"
                    strokeDasharray={`${citedDash} ${100 - citedDash}`} strokeDashoffset="25"
                    strokeLinecap="round" transform="rotate(-90 18 18)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-strong)', letterSpacing: '-0.02em' }}>{citationPct}%</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>cited</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--success)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink)', flex: 1 }}>引用付きで回答</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--ink-faint)' }}>{citationPct}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--hair-strong)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink)', flex: 1 }}>引用なし</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--ink-faint)' }}>{(100 - citedDash).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="field-hint" style={{ marginTop: 16, borderTop: '1px solid var(--hair)', paddingTop: 14 }}>
              引用率が低い場合は{' '}
              <button
                type="button"
                onClick={() => navigate('/sources')}
                style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                ソース
              </button>
              {' '}の追加や本文の充実を検討してください。
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
