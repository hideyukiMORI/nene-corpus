import { fetchJson } from './fetch-json';
import type { LlmSettingsResponse, TestLlmConnectionRequest, UpdateLlmSettingsRequest } from './types';

export async function getLlmSettings(token: string, apiBase = ''): Promise<LlmSettingsResponse> {
  return fetchJson<LlmSettingsResponse>(`${apiBase}/admin/settings/llm`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateLlmSettings(
  token: string,
  body: UpdateLlmSettingsRequest,
  apiBase = '',
): Promise<LlmSettingsResponse> {
  return fetchJson<LlmSettingsResponse>(`${apiBase}/admin/settings/llm`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function testLlmConnection(
  token: string,
  body: TestLlmConnectionRequest = {},
  apiBase = '',
): Promise<{ ok: true }> {
  return fetchJson<{ ok: true }>(`${apiBase}/admin/settings/llm/test`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
