import { FormEvent, useEffect, useState } from 'react';
import { getChatSettings, updateChatSettings } from '@/shared/api/chat-settings';
import type { ChatSettingsResponse } from '@/shared/api/types';
import { Msg, useMsg } from '@/shared/i18n';
import { adminApiBase } from './config';

interface ChatSettingsPanelProps {
  token: string;
}

export function ChatSettingsPanel({ token }: ChatSettingsPanelProps) {
  const t = useMsg();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<{ systemPrompt: string; fallbackMessage: string } | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const loaded = await getChatSettings(token, adminApiBase);
        if (!cancelled) {
          applySettings(loaded);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.chatSettings.loadFailed));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  function applySettings(loaded: ChatSettingsResponse): void {
    setDefaults({ systemPrompt: loaded.default_system_prompt, fallbackMessage: loaded.default_fallback_message });
    setSystemPrompt(loaded.system_prompt ?? '');
    setFallbackMessage(loaded.fallback_message ?? '');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateChatSettings(
        token,
        {
          system_prompt: systemPrompt.trim() !== '' ? systemPrompt.trim() : null,
          fallback_message: fallbackMessage.trim() !== '' ? fallbackMessage.trim() : null,
        },
        adminApiBase,
      );
      applySettings(updated);
      setSuccess(t(Msg.admin.chatSettings.saveSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.chatSettings.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm nc-text-muted">{t(Msg.common.loading)}</p>;
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-fg">{t(Msg.admin.chatSettings.title)}</h2>
      <p className="mt-1 text-sm nc-text-muted">{t(Msg.admin.chatSettings.subtitle)}</p>

      <form className="mt-4 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <label className="block text-sm font-medium text-fg">
            {t(Msg.admin.chatSettings.systemPrompt)}
          </label>
          <p className="mt-0.5 text-xs nc-text-muted">{t(Msg.admin.chatSettings.systemPromptHelp)}</p>
          <textarea
            className="nc-input mt-1 min-h-36 font-mono text-xs"
            value={systemPrompt}
            placeholder={defaults?.systemPrompt ?? ''}
            onChange={(event) => setSystemPrompt(event.target.value)}
          />
          {systemPrompt.trim() !== '' && (
            <button
              className="mt-1 text-xs nc-text-muted underline hover:text-fg"
              type="button"
              onClick={() => setSystemPrompt('')}
            >
              {t(Msg.admin.chatSettings.resetToDefault)}
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-fg">
            {t(Msg.admin.chatSettings.fallbackMessage)}
          </label>
          <p className="mt-0.5 text-xs nc-text-muted">{t(Msg.admin.chatSettings.fallbackMessageHelp)}</p>
          <textarea
            className="nc-input mt-1 min-h-20 font-mono text-xs"
            value={fallbackMessage}
            placeholder={defaults?.fallbackMessage ?? ''}
            onChange={(event) => setFallbackMessage(event.target.value)}
          />
          {fallbackMessage.trim() !== '' && (
            <button
              className="mt-1 text-xs nc-text-muted underline hover:text-fg"
              type="button"
              onClick={() => setFallbackMessage('')}
            >
              {t(Msg.admin.chatSettings.resetToDefault)}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="nc-btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? t(Msg.admin.chatSettings.saving) : t(Msg.admin.chatSettings.save)}
          </button>
        </div>
      </form>

      {error !== null && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success !== null && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
    </section>
  );
}
