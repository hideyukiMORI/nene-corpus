import { FormEvent, useEffect, useState } from 'react';
import { getLlmSettings, testLlmConnection, updateLlmSettings } from '@/shared/api/llm-settings';
import type { LlmSettingsResponse } from '@/shared/api/types';
import { Msg, useMsg } from '@/shared/i18n';
import { adminApiBase } from './config';

interface LlmSettingsPanelProps {
  token: string;
  /** 外部から開閉を制御する場合に渡す（未指定時は内部 state で管理） */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** API キー設定済み状態が変化したときに通知する */
  onConfiguredChange?: (configured: boolean) => void;
  /** モーダル内など、アコーディオンヘッダーが不要な場合に true を渡す */
  hideHeader?: boolean;
}

export function LlmSettingsPanel({ token, isOpen: isOpenProp, onOpenChange, onConfiguredChange, hideHeader = false }: LlmSettingsPanelProps) {
  const t = useMsg();
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenInternal;
  function setIsOpen(next: boolean | ((prev: boolean) => boolean)): void {
    const value = typeof next === 'function' ? next(isOpen) : next;
    setIsOpenInternal(value);
    onOpenChange?.(value);
  }
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<LlmSettingsResponse | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [model, setModel] = useState('');
  const [maxTokens, setMaxTokens] = useState('1024');

  // 初展開時のみ設定をロード
  useEffect(() => {
    if (!isOpen || hasLoaded) {
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const loaded = await getLlmSettings(token, adminApiBase);
        if (!cancelled) {
          applySettings(loaded);
          setHasLoaded(true);
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
  }, [isOpen, hasLoaded, token, t]);

  function applySettings(loaded: LlmSettingsResponse): void {
    setSettings(loaded);
    setModel(loaded.model);
    setMaxTokens(String(loaded.max_tokens));
    setApiKeyDraft('');
    onConfiguredChange?.(loaded.configured);
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
    <section className="nc-panel">
      {/* アコーディオンヘッダー（hideHeader 時は非表示） */}
      {!hideHeader && (
        <button
          type="button"
          className={`flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left ${isOpen ? 'border-b border-border' : ''}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <div className="min-w-0">
            <h2 className="font-medium">{t(Msg.admin.llm.title)}</h2>
            <p>{t(Msg.admin.llm.subtitle)}</p>
          </div>
          <span
            className="shrink-0 text-fg-muted transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>
      )}

      {/* アコーディオンボディ */}
      {isOpen && (
        <div className="px-4 pb-5 pt-2">
          {isLoading ? (
            <p className="text-sm nc-text-muted">{t(Msg.common.loading)}</p>
          ) : (
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
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
        </div>
      )}
    </section>
  );
}
