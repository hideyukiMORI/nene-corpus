import { fetchJson } from './fetch-json';
import type {
  AdminMeResponse,
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

export async function listSources(token: string, apiBase = ''): Promise<ListSourcesResponse> {
  return fetchJson<ListSourcesResponse>(`${apiBase}/admin/sources`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
