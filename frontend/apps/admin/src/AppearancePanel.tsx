import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  buildWidgetPreviewSearchParams,
  getAppearanceSettings,
  updateAppearanceSettings,
  type AppearanceSettingsResponse,
  type WidgetTheme,
} from '@nene-corpus/api-client';
import { Msg, useMsg } from '@nene-corpus/i18n';

const DEFAULT_THEME: WidgetTheme = {
  color_primary: '#2563eb',
  color_surface: '#ffffff',
  color_text: '#1f2937',
  radius_md: '0.5rem',
};

const WIDGET_LOCALES = ['', 'en', 'ja', 'fr', 'zh-Hans', 'pt-BR', 'de'] as const;

function widgetPreviewOrigin(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:5174';
  }

  return `${window.location.origin}/widget-preview.html`;
}

interface AppearancePanelProps {
  token: string;
}

export function AppearancePanel({ token }: AppearancePanelProps) {
  const t = useMsg();
  const [widgetLocale, setWidgetLocale] = useState('');
  const [theme, setTheme] = useState<WidgetTheme>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const settings = await getAppearanceSettings(token);

        if (!cancelled) {
          applySettings(settings);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t(Msg.admin.appearance.loadFailed));
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

  function applySettings(settings: AppearanceSettingsResponse): void {
    setWidgetLocale(settings.widget_locale ?? '');
    setTheme(settings.theme);
  }

  function updateThemeField(field: keyof WidgetTheme, value: string): void {
    setTheme((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const saved = await updateAppearanceSettings(token, {
        widget_locale: widgetLocale === '' ? null : (widgetLocale as AppearanceSettingsResponse['widget_locale']),
        theme,
      });
      applySettings(saved);
      setSuccess(t(Msg.admin.appearance.saveSuccess));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t(Msg.admin.appearance.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  const previewSrc = useMemo(() => {
    const query = buildWidgetPreviewSearchParams(
      theme,
      widgetLocale === '' ? null : widgetLocale,
    );

    return `${widgetPreviewOrigin()}?${query}`;
  }, [theme, widgetLocale]);

  function localeLabel(value: string): string {
    if (value === '') {
      return t(Msg.admin.appearance.widgetLocaleBrowser);
    }

    const map: Record<string, string> = {
      en: t(Msg.locale.en),
      ja: t(Msg.locale.ja),
      fr: t(Msg.locale.fr),
      'zh-Hans': t(Msg.locale.zhHans),
      'pt-BR': t(Msg.locale.ptBr),
      de: t(Msg.locale.de),
    };

    return map[value] ?? value;
  }

  return (
    <section className="nc-panel">
      <div className="nc-panel-head">
        <h2 className="font-medium">{t(Msg.admin.appearance.title)}</h2>
        <p className="text-sm text-fg-muted">{t(Msg.admin.appearance.subtitle)}</p>
      </div>
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-fg-muted">{t(Msg.common.loading)}</p>
      ) : (
        <form className="space-y-4 px-4 py-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block text-sm">
            <span className="font-medium text-fg">{t(Msg.admin.appearance.widgetLocale)}</span>
            <select
              className="nc-input"
              value={widgetLocale}
              onChange={(event) => setWidgetLocale(event.target.value)}
            >
              {WIDGET_LOCALES.map((value) => (
                <option key={value || 'browser'} value={value}>
                  {localeLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              label={t(Msg.admin.appearance.colorPrimary)}
              value={theme.color_primary}
              onChange={(value) => updateThemeField('color_primary', value)}
            />
            <ColorField
              label={t(Msg.admin.appearance.colorSurface)}
              value={theme.color_surface}
              onChange={(value) => updateThemeField('color_surface', value)}
            />
            <ColorField
              label={t(Msg.admin.appearance.colorText)}
              value={theme.color_text}
              onChange={(value) => updateThemeField('color_text', value)}
            />
            <label className="block text-sm">
              <span className="font-medium text-fg">{t(Msg.admin.appearance.radiusMd)}</span>
              <input
                className="nc-input"
                type="text"
                value={theme.radius_md}
                onChange={(event) => updateThemeField('radius_md', event.target.value)}
              />
            </label>
          </div>
          <div>
            <h3 className="text-sm font-medium text-fg">{t(Msg.admin.appearance.previewTitle)}</h3>
            <iframe
              className="mt-2 h-80 w-full rounded-admin border border-border bg-surface"
              title={t(Msg.admin.appearance.previewTitle)}
              src={previewSrc}
            />
          </div>
          <button className="nc-btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? t(Msg.admin.appearance.saving) : t(Msg.admin.appearance.save)}
          </button>
          {error !== null && <p className="text-sm text-red-600">{error}</p>}
          {success !== null && <p className="text-sm text-emerald-700">{success}</p>}
        </form>
      )}
    </section>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-fg">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          className="h-10 w-12 cursor-pointer rounded-admin border border-border-strong"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className="nc-input font-mono text-xs"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}
