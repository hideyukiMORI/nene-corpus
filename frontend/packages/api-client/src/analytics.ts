import { createAdminTransport } from './transport.js';

// ── Response types ────────────────────────────────────────────────────────────

export interface AnalyticsDailyCount {
  date: string;
  sessions: number;
  messages: number;
}

export interface AnalyticsHourlyCount {
  hour: number;
  sessions: number;
}

export interface AnalyticsSummaryResponse {
  sessions: {
    today: number;
    this_week: number;
    total: number;
  };
  messages: {
    user_total: number;
    assistant_total: number;
  };
  tokens: {
    input_total: number;
    output_total: number;
  };
  avg_messages_per_session: number;
  citation_rate: number;
  daily_trend: AnalyticsDailyCount[];
  hourly_distribution: AnalyticsHourlyCount[];
}

export interface TopQuestion {
  content: string;
  count: number;
  last_asked_at: string;
}

export interface TopQuestionsResponse {
  questions: TopQuestion[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function getAnalyticsSummary(
  token: string,
  apiBase = '',
): Promise<AnalyticsSummaryResponse> {
  return createAdminTransport(token, apiBase).get<AnalyticsSummaryResponse>(
    '/admin/analytics/summary',
  );
}

export async function getTopQuestions(
  token: string,
  apiBase = '',
  options: { limit?: number; from?: string; to?: string } = {},
): Promise<TopQuestionsResponse> {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);

  const query = params.toString();
  const path = query ? `/admin/analytics/top-questions?${query}` : '/admin/analytics/top-questions';

  return createAdminTransport(token, apiBase).get<TopQuestionsResponse>(path);
}

/** Path (no `apiBase` prefix) for the CSV export endpoint — for use with `createAdminTransport().getBlob()`. */
export function buildExportPath(
  format: 'sessions' | 'conversations',
  from?: string,
  to?: string,
): string {
  const params = new URLSearchParams({ format });
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  return `/admin/analytics/export?${params.toString()}`;
}

/**
 * Returns the download URL for the CSV export (opens directly via <a> tag).
 * Kept for backward compatibility (e.g. the unrouted `AnalyticsPanel.tsx`);
 * the routed `AnalyticsPage.tsx` uses `buildExportPath` + `createAdminTransport().getBlob()`
 * instead so the request goes through the X-Authorization mirror.
 */
export function buildExportUrl(
  apiBase: string,
  format: 'sessions' | 'conversations',
  from?: string,
  to?: string,
): string {
  return `${apiBase}${buildExportPath(format, from, to)}`;
}
