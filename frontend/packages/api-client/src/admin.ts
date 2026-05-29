import { fetchJson } from './fetch-json';
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
  return fetchJson<AdminMeResponse>(`${apiBase}/admin/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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

  return fetchJson<ListSourcesResponse>(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteSource(token: string, sourceId: number, apiBase = ''): Promise<void> {
  await fetchJson<void>(`${apiBase}/admin/sources/${sourceId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateSource(
  token: string,
  sourceId: number,
  payload: { name: string; note?: string | null },
  apiBase = '',
): Promise<UpdateSourceResponse> {
  return fetchJson<UpdateSourceResponse>(`${apiBase}/admin/sources/${sourceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: payload.name, note: payload.note ?? null }),
  });
}

export async function reindexSource(token: string, sourceId: number, apiBase = ''): Promise<void> {
  await fetchJson<void>(`${apiBase}/admin/sources/${sourceId}/reindex`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
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

  return fetchJson<ListChatSessionsResponse>(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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

  return fetchJson<ListChatSessionMessagesResponse>(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cleanupChatSessions(
  token: string,
  apiBase = '',
  maxAgeDays = 90,
): Promise<{ deleted_count: number }> {
  return fetchJson<{ deleted_count: number }>(
    `${apiBase}/admin/chat/sessions?max_age_days=${maxAgeDays}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}
