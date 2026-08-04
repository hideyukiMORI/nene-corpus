import { FormEvent, useEffect, useState } from 'react';
import { getChatLimitsSettings, updateChatLimitsSettings } from '@/shared/api';
import type { ChatLimitsSettingsResponse } from '@/shared/api';
import { Msg, useMsg } from '@/shared/i18n';
import { adminApiBase } from './config';
import { HelpLabel } from './HelpLabel';

// ── Preset definitions ─────────────────────────────────────────────────────

type PresetKey = 'conservative' | 'standard' | 'open' | 'unlimited';

type LimitsFields = Omit<ChatLimitsSettingsResponse, never>;

const PRESETS: Record<PresetKey, LimitsFields> = {
  conservative: {
    max_message_chars: 300,
    message_interval_seconds: 15,
    session_requests_per_hour: 10,
    ip_requests_per_hour: 30,
    daily_requests_per_ip: 50,
    daily_requests_global: 300,
    daily_tokens_per_ip: 20000,
    daily_tokens_global: 100000,
  },
  standard: {
    max_message_chars: 800,
    message_interval_seconds: 10,
    session_requests_per_hour: 20,
    ip_requests_per_hour: 60,
    daily_requests_per_ip: 200,
    daily_requests_global: 2000,
    daily_tokens_per_ip: 100000,
    daily_tokens_global: 1000000,
  },
  open: {
    max_message_chars: 2000,
    message_interval_seconds: 5,
    session_requests_per_hour: 50,
    ip_requests_per_hour: 200,
    daily_requests_per_ip: 500,
    daily_requests_global: 0,
    daily_tokens_per_ip: 500000,
    daily_tokens_global: 0,
  },
  unlimited: {
    max_message_chars: 0,
    message_interval_seconds: 0,
    session_requests_per_hour: 0,
    ip_requests_per_hour: 0,
    daily_requests_per_ip: 0,
    daily_requests_global: 0,
    daily_tokens_per_ip: 0,
    daily_tokens_global: 0,
  },
};

// ── Component ─────────────────────────────────────────────────────────────

interface ChatLimitsPanelProps {
  token: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** モーダル内など、アコーディオンヘッダーが不要な場合に true を渡す */
  hideHeader?: boolean;
}

type DraftFields = {
  max_message_chars: string;
  message_interval_seconds: string;
  session_requests_per_hour: string;
  ip_requests_per_hour: string;
  daily_requests_per_ip: string;
  daily_requests_global: string;
  daily_tokens_per_ip: string;
  daily_tokens_global: string;
};

function toDraft(v: LimitsFields): DraftFields {
  return {
    max_message_chars: String(v.max_message_chars),
    message_interval_seconds: String(v.message_interval_seconds),
    session_requests_per_hour: String(v.session_requests_per_hour),
    ip_requests_per_hour: String(v.ip_requests_per_hour),
    daily_requests_per_ip: String(v.daily_requests_per_ip),
    daily_requests_global: String(v.daily_requests_global),
    daily_tokens_per_ip: String(v.daily_tokens_per_ip),
    daily_tokens_global: String(v.daily_tokens_global),
  };
}

export function ChatLimitsPanel({ token, isOpen: isOpenProp, onOpenChange, hideHeader = false }: ChatLimitsPanelProps) {
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftFields>(toDraft(PRESETS.standard));

  // Lazy load on first open
  useEffect(() => {
    if (!isOpen || hasLoaded) {
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getChatLimitsSettings(token, adminApiBase);

        if (!cancelled) {
          setDraft(toDraft(data));
          setHasLoaded(true);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.chatLimits.loadFailed));
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

  function applyPreset(key: PresetKey): void {
    setDraft(toDraft(PRESETS[key]));
    setSuccess(null);
    setError(null);
  }

  function updateField(field: keyof DraftFields, value: string): void {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body = {
        max_message_chars: Number.parseInt(draft.max_message_chars, 10) || 0,
        message_interval_seconds: Number.parseInt(draft.message_interval_seconds, 10) || 0,
        session_requests_per_hour: Number.parseInt(draft.session_requests_per_hour, 10) || 0,
        ip_requests_per_hour: Number.parseInt(draft.ip_requests_per_hour, 10) || 0,
        daily_requests_per_ip: Number.parseInt(draft.daily_requests_per_ip, 10) || 0,
        daily_requests_global: Number.parseInt(draft.daily_requests_global, 10) || 0,
        daily_tokens_per_ip: Number.parseInt(draft.daily_tokens_per_ip, 10) || 0,
        daily_tokens_global: Number.parseInt(draft.daily_tokens_global, 10) || 0,
      };

      const saved = await updateChatLimitsSettings(token, body, adminApiBase);
      setDraft(toDraft(saved));
      setSuccess(t(Msg.admin.chatLimits.saveSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.chatLimits.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="nc-panel">
      {/* Accordion header（hideHeader 時は非表示） */}
      {!hideHeader && (
        <button
          type="button"
          className={`flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left ${isOpen ? 'border-b border-border' : ''}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <div className="min-w-0">
            <h2 className="font-medium">{t(Msg.admin.chatLimits.title)}</h2>
            <p className="text-xs leading-normal nc-text-muted">{t(Msg.admin.chatLimits.subtitle)}</p>
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

      {/* Accordion body */}
      {isOpen && (
        <div className="px-4 pb-5 pt-3">
          {isLoading ? (
            <p className="text-sm nc-text-muted">{t(Msg.common.loading)}</p>
          ) : (
            <>
              {/* Preset buttons */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs nc-text-muted">{t(Msg.admin.chatLimits.presetLabel)}</span>
                {(['conservative', 'standard', 'open', 'unlimited'] as const).map((key) => {
                  const labels: Record<PresetKey, string> = {
                    conservative: t(Msg.admin.chatLimits.presetConservative),
                    standard: t(Msg.admin.chatLimits.presetStandard),
                    open: t(Msg.admin.chatLimits.presetOpen),
                    unlimited: t(Msg.admin.chatLimits.presetUnlimited),
                  };

                  return (
                    <button
                      key={key}
                      type="button"
                      className="nc-btn text-xs"
                      onClick={() => applyPreset(key)}
                    >
                      {labels[key]}
                    </button>
                  );
                })}
              </div>

              <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                <LimitField
                  label={t(Msg.admin.chatLimits.maxMessageChars)}
                  help={t(Msg.admin.chatLimits.maxMessageCharsHelp)}
                  value={draft.max_message_chars}
                  hint={t(Msg.admin.chatLimits.zeroMeansUnlimited)}
                  onChange={(v) => updateField('max_message_chars', v)}
                />
                <LimitField
                  label={t(Msg.admin.chatLimits.messageIntervalSeconds)}
                  help={t(Msg.admin.chatLimits.messageIntervalSecondsHelp)}
                  value={draft.message_interval_seconds}
                  hint={t(Msg.admin.chatLimits.zeroMeansUnlimited)}
                  onChange={(v) => updateField('message_interval_seconds', v)}
                />
                <LimitField
                  label={t(Msg.admin.chatLimits.sessionRequestsPerHour)}
                  help={t(Msg.admin.chatLimits.sessionRequestsPerHourHelp)}
                  value={draft.session_requests_per_hour}
                  hint={t(Msg.admin.chatLimits.zeroMeansUnlimited)}
                  onChange={(v) => updateField('session_requests_per_hour', v)}
                />
                <LimitField
                  label={t(Msg.admin.chatLimits.ipRequestsPerHour)}
                  help={t(Msg.admin.chatLimits.ipRequestsPerHourHelp)}
                  value={draft.ip_requests_per_hour}
                  hint={t(Msg.admin.chatLimits.zeroMeansUnlimited)}
                  onChange={(v) => updateField('ip_requests_per_hour', v)}
                />
                <LimitField
                  label={t(Msg.admin.chatLimits.dailyRequestsPerIp)}
                  help={t(Msg.admin.chatLimits.dailyRequestsPerIpHelp)}
                  value={draft.daily_requests_per_ip}
                  hint={t(Msg.admin.chatLimits.zeroMeansUnlimited)}
                  onChange={(v) => updateField('daily_requests_per_ip', v)}
                />
                <LimitField
                  label={t(Msg.admin.chatLimits.dailyRequestsGlobal)}
                  help={t(Msg.admin.chatLimits.dailyRequestsGlobalHelp)}
                  value={draft.daily_requests_global}
                  hint={t(Msg.admin.chatLimits.zeroMeansUnlimited)}
                  onChange={(v) => updateField('daily_requests_global', v)}
                />
                <LimitField
                  label={t(Msg.admin.chatLimits.dailyTokensPerIp)}
                  help={t(Msg.admin.chatLimits.dailyTokensPerIpHelp)}
                  value={draft.daily_tokens_per_ip}
                  hint={t(Msg.admin.chatLimits.zeroMeansUnlimited)}
                  onChange={(v) => updateField('daily_tokens_per_ip', v)}
                />
                <LimitField
                  label={t(Msg.admin.chatLimits.dailyTokensGlobal)}
                  help={t(Msg.admin.chatLimits.dailyTokensGlobalHelp)}
                  value={draft.daily_tokens_global}
                  hint={t(Msg.admin.chatLimits.zeroMeansUnlimited)}
                  onChange={(v) => updateField('daily_tokens_global', v)}
                />

                <button className="nc-btn-primary" type="submit" disabled={isSaving}>
                  {isSaving ? t(Msg.admin.chatLimits.saving) : t(Msg.admin.chatLimits.save)}
                </button>

                {error !== null && <p className="text-sm text-red-600">{error}</p>}
                {success !== null && <p className="text-sm text-emerald-700">{success}</p>}
              </form>
            </>
          )}
        </div>
      )}
    </section>
  );
}

// ── Sub-component: single limit field ────────────────────────────────────

interface LimitFieldProps {
  label: string;
  help: string;
  value: string;
  hint: string;
  onChange: (value: string) => void;
}

function LimitField({ label, help, value, hint, onChange }: LimitFieldProps) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-fg">
        <HelpLabel label={label} help={help} />
      </span>
      <input
        className="nc-input mt-1"
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="mt-0.5 block text-xs nc-text-muted">{hint}</span>
    </label>
  );
}
