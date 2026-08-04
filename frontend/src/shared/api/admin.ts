import { fetchJson } from './fetch-json';
import { createAdminTransport } from './transport';
import type {
  AdminMeResponse,
  ListChatSessionMessagesResponse,
  ListChatSessionsResponse,
  ListSourcesResponse,
  LoginAdminResponse,
  UpdateSourceResponse,
} from './types';

export async function loginAdmin(
  email: string,
  password: string,
  apiBase = '',
): Promise<LoginAdminResponse> {
  return fetchJson<LoginAdminResponse>(`${apiBase}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function requestPasswordReset(email: string, apiBase = ''): Promise<void> {
  await fetchJson<void>(`${apiBase}/admin/auth/password-reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(
  token: string,
  password: string,
  apiBase = '',
): Promise<void> {
  await fetchJson<void>(`${apiBase}/admin/auth/password-reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
}

export async function getAdminMe(token: string, apiBase = ''): Promise<AdminMeResponse> {
  return createAdminTransport(token, apiBase).get<AdminMeResponse>('/admin/auth/me');
}

export async function listSources(
  token: string,
  apiBase = '',
  options: { limit?: number; offset?: number } = {},
): Promise<ListSourcesResponse> {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }

  if (options.offset !== undefined) {
    params.set('offset', String(options.offset));
  }

  const query = params.toString();
  const path = query.length > 0 ? `/admin/sources?${query}` : '/admin/sources';

  return createAdminTransport(token, apiBase).get<ListSourcesResponse>(path);
}

export async function deleteSource(token: string, sourceId: number, apiBase = ''): Promise<void> {
  await createAdminTransport(token, apiBase).delete<void>(`/admin/sources/${sourceId}`);
}

export async function updateSource(
  token: string,
  sourceId: number,
  payload: { name: string; note?: string | null },
  apiBase = '',
): Promise<UpdateSourceResponse> {
  return createAdminTransport(token, apiBase).put<UpdateSourceResponse>(
    `/admin/sources/${sourceId}`,
    { name: payload.name, note: payload.note ?? null },
  );
}

export async function reindexSource(token: string, sourceId: number, apiBase = ''): Promise<void> {
  await createAdminTransport(token, apiBase).post<void>(`/admin/sources/${sourceId}/reindex`, {});
}

export async function listChatSessions(
  token: string,
  apiBase = '',
  options: { limit?: number; offset?: number } = {},
): Promise<ListChatSessionsResponse> {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }

  if (options.offset !== undefined) {
    params.set('offset', String(options.offset));
  }

  const query = params.toString();
  const path = query.length > 0 ? `/admin/chat/sessions?${query}` : '/admin/chat/sessions';

  return createAdminTransport(token, apiBase).get<ListChatSessionsResponse>(path);
}

export async function listChatSessionMessages(
  token: string,
  sessionId: number,
  apiBase = '',
  options: { limit?: number; offset?: number } = {},
): Promise<ListChatSessionMessagesResponse> {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }

  if (options.offset !== undefined) {
    params.set('offset', String(options.offset));
  }

  const query = params.toString();
  const path =
    query.length > 0
      ? `/admin/chat/sessions/${sessionId}/messages?${query}`
      : `/admin/chat/sessions/${sessionId}/messages`;

  return createAdminTransport(token, apiBase).get<ListChatSessionMessagesResponse>(path);
}

export async function cleanupChatSessions(
  token: string,
  apiBase = '',
  maxAgeDays = 90,
): Promise<{ deleted_count: number }> {
  return createAdminTransport(token, apiBase).delete<{ deleted_count: number }>(
    `/admin/chat/sessions?max_age_days=${maxAgeDays}`,
  );
}
