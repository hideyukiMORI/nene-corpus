import { fetchJson } from './fetch-json.js';

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
  return fetchJson<AnalyticsSummaryResponse>(`${apiBase}/admin/analytics/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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

  return fetchJson<TopQuestionsResponse>(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Returns the download URL for the CSV export (opens directly via <a> tag). */
export function buildExportUrl(
  apiBase: string,
  format: 'sessions' | 'conversations',
  from?: string,
  to?: string,
): string {
  const params = new URLSearchParams({ format });
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  return `${apiBase}/admin/analytics/export?${params.toString()}`;
}
