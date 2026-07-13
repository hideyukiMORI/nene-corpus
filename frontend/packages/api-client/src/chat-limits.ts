import { createAdminTransport } from './transport';
import type { ChatLimitsSettingsResponse, UpdateChatLimitsSettingsRequest } from './types';

export async function getChatLimitsSettings(
  token: string,
  apiBase = '',
): Promise<ChatLimitsSettingsResponse> {
  return createAdminTransport(token, apiBase).get<ChatLimitsSettingsResponse>(
    '/admin/settings/limits',
  );
}

export async function updateChatLimitsSettings(
  token: string,
  body: UpdateChatLimitsSettingsRequest,
  apiBase = '',
): Promise<ChatLimitsSettingsResponse> {
  return createAdminTransport(token, apiBase).put<ChatLimitsSettingsResponse>(
    '/admin/settings/limits',
    body,
  );
}
