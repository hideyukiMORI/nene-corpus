import { createAdminTransport } from './transport';
import type { LlmSettingsResponse, TestLlmConnectionRequest, UpdateLlmSettingsRequest } from './types';

export async function getLlmSettings(token: string, apiBase = ''): Promise<LlmSettingsResponse> {
  return createAdminTransport(token, apiBase).get<LlmSettingsResponse>('/admin/settings/llm');
}

export async function updateLlmSettings(
  token: string,
  body: UpdateLlmSettingsRequest,
  apiBase = '',
): Promise<LlmSettingsResponse> {
  return createAdminTransport(token, apiBase).put<LlmSettingsResponse>(
    '/admin/settings/llm',
    body,
  );
}

export async function testLlmConnection(
  token: string,
  body: TestLlmConnectionRequest = {},
  apiBase = '',
): Promise<{ ok: true }> {
  return createAdminTransport(token, apiBase).post<{ ok: true }>(
    '/admin/settings/llm/test',
    body,
  );
}
