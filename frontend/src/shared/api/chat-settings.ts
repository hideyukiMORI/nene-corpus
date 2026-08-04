import { createAdminTransport } from './transport';
import type { ChatSettingsResponse, UpdateChatSettingsRequest } from './types';

export async function getChatSettings(token: string, apiBase = ''): Promise<ChatSettingsResponse> {
  return createAdminTransport(token, apiBase).get<ChatSettingsResponse>('/admin/settings/chat');
}

export async function updateChatSettings(
  token: string,
  body: UpdateChatSettingsRequest,
  apiBase = '',
): Promise<ChatSettingsResponse> {
  return createAdminTransport(token, apiBase).put<ChatSettingsResponse>(
    '/admin/settings/chat',
    body,
  );
}
