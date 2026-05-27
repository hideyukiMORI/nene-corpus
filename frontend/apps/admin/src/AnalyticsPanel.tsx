/**
 * AnalyticsPanel — 会話分析ダッシュボード (#255)
 *
 * - KPI カード: セッション数・メッセージ数・トークン・引用率
 * - 過去 30 日セッション推移グラフ（外部ライブラリ不要 CSS バー）
 * - 時間帯別セッション分布
 * - よく聞かれた質問 TOP 20
 * - CSV エクスポート（sessions / conversations、期間指定）
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getAnalyticsSummary,
  getTopQuestions,
  buildExportUrl,
  type AnalyticsSummaryResponse,
  type TopQuestion,
} from '@nene-corpus/api-client';
import { Msg, formatTimestamp, useLocale, useMsg } from '@nene-corpus/i18n';
import { adminApiBase } from './config';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsPanelProps {
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

// ── Sub-components ────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
      {sub !== undefined && (
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
      )}
    </div>
  );
}

interface BarChartProps {
  data: { label: string; value: number }[];
  maxValue: number;
  colorClass?: string;
}

function BarChart({ data, maxValue, colorClass = 'bg-blue-500' }: BarChartProps) {
  const safeMax = maxValue === 0 ? 1 : maxValue;

  return (
    <div className="flex h-28 items-end gap-px overflow-hidden">
      {data.map((item) => (
        <div
          key={item.label}
          className="group relative flex flex-1 flex-col items-center justify-end"
          title={`${item.label}: ${String(item.value)}`}
        >
          <div
            className={`w-full rounded-t ${colorClass} opacity-80 transition-opacity group-hover:opacity-100`}
            style={{ height: `${Math.max((item.value / safeMax) * 100, item.value > 0 ? 4 : 0)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsPanel({ token }: AnalyticsPanelProps) {
  const t = useMsg();
  const { locale } = useLocale();

  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [questions, setQuestions] = useState<TopQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Export date range state
  const [exportFrom, setExportFrom] = useState(thirtyDaysAgoIso());
  const [exportTo, setExportTo] = useState(todayIso());

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
      setError(cause instanceof Error ? cause.message : t(Msg.admin.analytics.loadFailed));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Derived chart data ───────────────────────────────────────────────────

  const dailyChartData = (summary?.daily_trend ?? []).map((d) => ({
    label: d.date,
    value: d.sessions,
  }));

  const dailyMax = Math.max(...dailyChartData.map((d) => d.value), 0);

  const hourlyChartData = (summary?.hourly_distribution ?? []).map((h) => ({
    label: String(h.hour).padStart(2, '0'),
    value: h.sessions,
  }));

  const hourlyMax = Math.max(...hourlyChartData.map((h) => h.value), 0);

  // ── Export download (uses JWT in Authorization header via fetch) ──────────
  // CSV export requires the JWT token. We use fetch + createObjectURL instead
  // of a plain <a href> to pass the Authorization header.

  const downloadExport = useCallback(
    async (format: 'sessions' | 'conversations') => {
      try {
        const url = buildExportUrl(adminApiBase, format, exportFrom || undefined, exportTo || undefined);
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
        alert(cause instanceof Error ? cause.message : 'Export failed');
      }
    },
    [token, exportFrom, exportTo],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <section className="nc-panel">
        <div className="nc-panel-head">
          <h2 className="font-medium">{t(Msg.admin.analytics.title)}</h2>
          <p>{t(Msg.admin.analytics.subtitle)}</p>
        </div>
        <div className="p-6 text-center text-sm text-gray-400">{t(Msg.admin.conversationLogs.loadingSessions)}</div>
      </section>
    );
  }

  if (error !== null) {
    return (
      <section className="nc-panel">
        <div className="nc-panel-head">
          <h2 className="font-medium">{t(Msg.admin.analytics.title)}</h2>
        </div>
        <p className="p-4 text-sm text-red-500">{error}</p>
      </section>
    );
  }

  return (
    <section className="nc-panel space-y-6">
      {/* Header */}
      <div className="nc-panel-head">
        <h2 className="font-medium">{t(Msg.admin.analytics.title)}</h2>
        <p>{t(Msg.admin.analytics.subtitle)}</p>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Sessions row */}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t(Msg.admin.analytics.sessionsTitle)}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label={t(Msg.admin.analytics.today)}
            value={summary?.sessions.today ?? 0}
          />
          <KpiCard
            label={t(Msg.admin.analytics.thisWeek)}
            value={summary?.sessions.this_week ?? 0}
          />
          <KpiCard
            label={t(Msg.admin.analytics.total)}
            value={summary?.sessions.total ?? 0}
          />
          <KpiCard
            label={t(Msg.admin.analytics.avgMessages)}
            value={summary?.avg_messages_per_session.toFixed(1) ?? '—'}
          />
        </div>

        {/* Messages + tokens row */}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t(Msg.admin.analytics.messagesTitle)} / {t(Msg.admin.analytics.tokensTitle)}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label={t(Msg.admin.analytics.userMessages)}
            value={summary?.messages.user_total ?? 0}
          />
          <KpiCard
            label={t(Msg.admin.analytics.assistantMessages)}
            value={summary?.messages.assistant_total ?? 0}
          />
          <KpiCard
            label={t(Msg.admin.analytics.inputTokens)}
            value={formatTokens(summary?.tokens.input_total ?? 0)}
          />
          <KpiCard
            label={t(Msg.admin.analytics.outputTokens)}
            value={formatTokens(summary?.tokens.output_total ?? 0)}
            sub={`${t(Msg.admin.analytics.citationRate)}: ${formatPercent(summary?.citation_rate ?? 0)}`}
          />
        </div>
      </div>

      {/* ── Daily trend ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t(Msg.admin.analytics.trendTitle)}
        </h3>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <BarChart data={dailyChartData} maxValue={dailyMax} colorClass="bg-blue-500" />
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>{dailyChartData.at(0)?.label ?? ''}</span>
            <span>{dailyChartData.at(-1)?.label ?? ''}</span>
          </div>
        </div>
      </div>

      {/* ── Hourly distribution ─────────────────────────────────────────── */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t(Msg.admin.analytics.hourlyTitle)}
        </h3>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <BarChart data={hourlyChartData} maxValue={hourlyMax} colorClass="bg-indigo-400" />
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>

      {/* ── Top questions ───────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t(Msg.admin.analytics.topQuestionsTitle)}
        </h3>
        {questions.length === 0 ? (
          <p className="text-sm text-gray-400">{t(Msg.admin.analytics.topQuestionsEmpty)}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-right w-10">{t(Msg.admin.analytics.rank)}</th>
                  <th className="px-3 py-2 text-left">{t(Msg.admin.analytics.question)}</th>
                  <th className="px-3 py-2 text-right w-16">{t(Msg.admin.analytics.count)}</th>
                  <th className="px-3 py-2 text-right w-36 whitespace-nowrap">{t(Msg.admin.analytics.lastAsked)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {questions.map((q, i) => (
                  <tr
                    key={`${q.content}-${String(i)}`}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-3 py-2 text-right tabular-nums text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 break-words max-w-xs text-gray-900 dark:text-gray-100">
                      {q.content}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-blue-600 dark:text-blue-400">
                      {q.count}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400 tabular-nums whitespace-nowrap">
                      {formatTimestamp(q.last_asked_at, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CSV Export ──────────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t(Msg.admin.analytics.exportTitle)}
        </h3>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
              {t(Msg.admin.analytics.exportFrom)}
              <input
                type="date"
                value={exportFrom}
                max={exportTo}
                onChange={(e) => { setExportFrom(e.target.value); }}
                className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
              {t(Msg.admin.analytics.exportTo)}
              <input
                type="date"
                value={exportTo}
                min={exportFrom}
                max={todayIso()}
                onChange={(e) => { setExportTo(e.target.value); }}
                className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="nc-btn text-sm"
              onClick={() => { void downloadExport('sessions'); }}
            >
              ↓ {t(Msg.admin.analytics.exportSessions)}
            </button>
            <button
              type="button"
              className="nc-btn text-sm"
              onClick={() => { void downloadExport('conversations'); }}
            >
              ↓ {t(Msg.admin.analytics.exportConversations)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
