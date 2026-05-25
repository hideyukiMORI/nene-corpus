import { useCallback, useEffect, useState } from 'react';
import { createChatSession, sendChatMessage } from '@nene-corpus/api-client';
import type { Citation } from '@nene-corpus/api-client';
import { loadStoredSessionToken, resolveWidgetConfig, storeSessionToken } from './config';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface UseChatSessionResult {
  turns: ChatTurn[];
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
}

export function useChatSession(configOverride?: { apiBase?: string }): UseChatSessionResult {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiBase = resolveWidgetConfig(configOverride).apiBase;

  useEffect(() => {
    let cancelled = false;

    async function ensureSession(): Promise<void> {
      const stored = loadStoredSessionToken();

      if (stored) {
        if (!cancelled) {
          setSessionToken(stored);
        }

        return;
      }

      try {
        const session = await createChatSession(apiBase);

        if (cancelled) {
          return;
        }

        storeSessionToken(session.session_token);
        setSessionToken(session.session_token);
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Failed to start chat session.');
        }
      }
    }

    void ensureSession();

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();

      if (trimmed === '' || sessionToken === null || isLoading) {
        return;
      }

      setError(null);
      setIsLoading(true);
      setTurns((current) => [
        ...current,
        { id: `user-${Date.now()}`, role: 'user', content: trimmed },
      ]);

      try {
        const response = await sendChatMessage(sessionToken, trimmed, apiBase);

        setTurns((current) => [
          ...current,
          {
            id: `assistant-${response.message_id}`,
            role: 'assistant',
            content: response.content,
            citations: response.citations,
          },
        ]);
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : 'Failed to send message.');
      } finally {
        setIsLoading(false);
      }
    },
    [apiBase, isLoading, sessionToken],
  );

  return {
    turns,
    isLoading,
    isReady: sessionToken !== null,
    error,
    sendMessage,
  };
}
