import { fetchJson } from './fetch-json';
import type { ChatLimitsSettingsResponse, UpdateChatLimitsSettingsRequest } from './types';

export async function getChatLimitsSettings(
  token: string,
  apiBase = '',
): Promise<ChatLimitsSettingsResponse> {
  return fetchJson<ChatLimitsSettingsResponse>(`${apiBase}/admin/settings/limits`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateChatLimitsSettings(
  token: string,
  body: UpdateChatLimitsSettingsRequest,
  apiBase = '',
): Promise<ChatLimitsSettingsResponse> {
  return fetchJson<ChatLimitsSettingsResponse>(`${apiBase}/admin/settings/limits`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
