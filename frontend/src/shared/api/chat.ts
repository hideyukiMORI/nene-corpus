import { fetchJson } from './fetch-json';
import type { CreateChatSessionResponse, SendChatMessageResponse } from './types';

export async function createChatSession(apiBase = ''): Promise<CreateChatSessionResponse> {
  return fetchJson<CreateChatSessionResponse>(`${apiBase}/chat/sessions`, {
    method: 'POST',
  });
}

export async function sendChatMessage(
  sessionToken: string,
  content: string,
  apiBase = '',
): Promise<SendChatMessageResponse> {
  return fetchJson<SendChatMessageResponse>(`${apiBase}/chat/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken,
    },
    body: JSON.stringify({ content }),
  });
}
