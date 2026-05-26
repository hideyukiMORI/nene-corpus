import { fetchJson } from './fetch-json';
import type {
  AdminMeResponse,
  ListChatSessionMessagesResponse,
  ListChatSessionsResponse,
  ListSourcesResponse,
  LoginAdminResponse,
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
