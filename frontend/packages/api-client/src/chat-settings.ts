import { fetchJson } from './fetch-json';
import type { ChatSettingsResponse, UpdateChatSettingsRequest } from './types';

export async function getChatSettings(token: string, apiBase = ''): Promise<ChatSettingsResponse> {
  return fetchJson<ChatSettingsResponse>(`${apiBase}/admin/settings/chat`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateChatSettings(
  token: string,
  body: UpdateChatSettingsRequest,
  apiBase = '',
): Promise<ChatSettingsResponse> {
  return fetchJson<ChatSettingsResponse>(`${apiBase}/admin/settings/chat`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
