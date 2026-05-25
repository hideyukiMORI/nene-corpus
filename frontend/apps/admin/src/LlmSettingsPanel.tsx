import { FormEvent, useEffect, useState } from 'react';
import { getLlmSettings, testLlmConnection, updateLlmSettings } from '@nene-corpus/api-client/llm-settings';
import type { LlmSettingsResponse } from '@nene-corpus/api-client/types';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { adminApiBase } from './config';

interface LlmSettingsPanelProps {
  token: string;
}

export function LlmSettingsPanel({ token }: LlmSettingsPanelProps) {
  const t = useMsg();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<LlmSettingsResponse | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [model, setModel] = useState('');
  const [maxTokens, setMaxTokens] = useState('1024');

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const loaded = await getLlmSettings(token, adminApiBase);
        if (!cancelled) {
          applySettings(loaded);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.llm.loadFailed));
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

  function applySettings(loaded: LlmSettingsResponse): void {
    setSettings(loaded);
    setModel(loaded.model);
    setMaxTokens(String(loaded.max_tokens));
    setApiKeyDraft('');
  }

  function buildTestPayload() {
    const payload: { api_key?: string; model: string } = { model: model.trim() };
    const trimmedKey = apiKeyDraft.trim();

    if (trimmedKey !== '') {
      payload.api_key = trimmedKey;
    }

    return payload;
  }

  function buildSavePayload() {
    const payload: { model: string; max_tokens: number; api_key?: string } = {
      model: model.trim(),
      max_tokens: Number.parseInt(maxTokens, 10),
    };
    const trimmedKey = apiKeyDraft.trim();

    if (trimmedKey !== '') {
      payload.api_key = trimmedKey;
    }

    return payload;
  }

  async function handleTest(): Promise<void> {
    setIsTesting(true);
    setError(null);
    setTestSuccess(null);

    try {
      await testLlmConnection(token, buildTestPayload(), adminApiBase);
      setTestSuccess(t(Msg.admin.llm.testSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.llm.testFailed));
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    setTestSuccess(null);

    try {
      const saved = await updateLlmSettings(token, buildSavePayload(), adminApiBase);
      applySettings(saved);
      setSuccess(t(Msg.admin.llm.saveSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.llm.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-admin border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-fg">{t(Msg.admin.llm.title)}</h2>
      <p className="mt-1 text-sm nc-text-muted">{t(Msg.admin.llm.subtitle)}</p>

      {isLoading ? (
        <p className="mt-4 text-sm nc-text-muted">{t(Msg.common.loading)}</p>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {settings?.api_key_masked && (
            <p className="text-sm nc-text-muted">
              {t(Msg.admin.llm.currentKey)}: <code>{settings.api_key_masked}</code>
            </p>
          )}
          <label className="block text-sm">
            <span className="font-medium text-fg">{t(Msg.admin.llm.apiKey)}</span>
            <span className="mt-0.5 block text-xs nc-text-muted">{t(Msg.admin.llm.apiKeyHelp)}</span>
            <input
              className="nc-input mt-1"
              type="password"
              value={apiKeyDraft}
              onChange={(event) => setApiKeyDraft(event.target.value)}
              placeholder={t(Msg.admin.llm.apiKeyPlaceholder)}
              autoComplete="off"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-fg">{t(Msg.admin.llm.model)}</span>
            <input
              className="nc-input mt-1"
              type="text"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-fg">{t(Msg.admin.llm.maxTokens)}</span>
            <input
              className="nc-input mt-1"
              type="number"
              min={1}
              max={8192}
              value={maxTokens}
              onChange={(event) => setMaxTokens(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="nc-btn" type="button" disabled={isTesting} onClick={() => void handleTest()}>
              {isTesting ? t(Msg.admin.llm.testing) : t(Msg.admin.llm.test)}
            </button>
            <button className="nc-btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? t(Msg.admin.llm.saving) : t(Msg.admin.llm.save)}
            </button>
          </div>
          {testSuccess !== null && <p className="text-sm text-emerald-700">{testSuccess}</p>}
          {error !== null && <p className="text-sm text-red-600">{error}</p>}
          {success !== null && <p className="text-sm text-emerald-700">{success}</p>}
        </form>
      )}
    </section>
  );
}
