import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  buildWidgetPreviewSearchParams,
  getAppearanceSettings,
  updateAppearanceSettings,
  type AppearanceSettingsResponse,
  type WidgetHero,
  type WidgetTheme,
} from '@nene-corpus/api-client';
import { Msg, resolveMsgKey, useLocale, useMsg, isUnresolvedTranslation, type MsgKey } from '@nene-corpus/i18n';
import { adminApiBase } from './config';
import { APPEARANCE_HERO_TOGGLE_FALLBACK } from './appearanceHeroToggleFallback';
import { EmbedSnippetSection } from './EmbedSnippetSection';
import { HelpLabel } from './HelpLabel';

/** Literal keys — do not read `Msg.admin.appearance` hero toggles at module init (Vite HMR may serve stale `keys.ts`). */
const HERO_TOGGLE_MSG = {
  showTitle: 'admin.appearance.heroShowTitle',
  showTitleHelp: 'admin.appearance.heroShowTitleHelp',
  showDescription: 'admin.appearance.heroShowDescription',
  showDescriptionHelp: 'admin.appearance.heroShowDescriptionHelp',
  showCta: 'admin.appearance.heroShowCta',
  showCtaHelp: 'admin.appearance.heroShowCtaHelp',
} as const satisfies Record<string, MsgKey>;

interface HeroFormState {
  title: string;
  description: string;
  cta_label: string;
  show_title: boolean;
  show_description: boolean;
  show_cta: boolean;
}

const EMPTY_HERO_FORM: HeroFormState = {
  title: '',
  description: '',
  cta_label: '',
  show_title: true,
  show_description: true,
  show_cta: true,
};

const DEFAULT_THEME: WidgetTheme = {
  color_primary: '#2563eb',
  color_surface: '#ffffff',
  color_text: '#1f2937',
  radius_md: '0.5rem',
  max_width: '100%',
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
  const { locale } = useLocale();
  const heroToggleFallback = APPEARANCE_HERO_TOGGLE_FALLBACK[locale];

  const heroToggleCopy = useMemo(() => {
    const resolve = (key: MsgKey, emergency: string): string => {
      const text = t(key);
      return isUnresolvedTranslation(text, key) ? emergency : text;
    };

    return {
      showTitle: resolve(HERO_TOGGLE_MSG.showTitle, heroToggleFallback.showTitle),
      showTitleHelp: resolve(HERO_TOGGLE_MSG.showTitleHelp, heroToggleFallback.showTitleHelp),
      showDescription: resolve(HERO_TOGGLE_MSG.showDescription, heroToggleFallback.showDescription),
      showDescriptionHelp: resolve(
        HERO_TOGGLE_MSG.showDescriptionHelp,
        heroToggleFallback.showDescriptionHelp,
      ),
      showCta: resolve(HERO_TOGGLE_MSG.showCta, heroToggleFallback.showCta),
      showCtaHelp: resolve(HERO_TOGGLE_MSG.showCtaHelp, heroToggleFallback.showCtaHelp),
    };
  }, [t, heroToggleFallback]);
  const [widgetLocale, setWidgetLocale] = useState('');
  const [theme, setTheme] = useState<WidgetTheme>(DEFAULT_THEME);
  const [heroForm, setHeroForm] = useState<HeroFormState>(EMPTY_HERO_FORM);
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
        const settings = await getAppearanceSettings(token, adminApiBase);

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
    setHeroForm({
      title: settings.hero.title ?? '',
      description: settings.hero.description ?? '',
      cta_label: settings.hero.cta_label ?? '',
      show_title: settings.hero.show_title,
      show_description: settings.hero.show_description,
      show_cta: settings.hero.show_cta,
    });
  }

  function updateHeroField<K extends keyof HeroFormState>(field: K, value: HeroFormState[K]): void {
    setHeroForm((current) => ({ ...current, [field]: value }));
  }

  function heroPayload(): WidgetHero {
    return {
      title: heroForm.title.trim() === '' ? null : heroForm.title.trim(),
      description: heroForm.description.trim() === '' ? null : heroForm.description.trim(),
      cta_label: heroForm.cta_label.trim() === '' ? null : heroForm.cta_label.trim(),
      show_title: heroForm.show_title,
      show_description: heroForm.show_description,
      show_cta: heroForm.show_cta,
    };
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
        hero: heroPayload(),
      }, adminApiBase);
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
      heroPayload(),
    );

    return `${widgetPreviewOrigin()}?${query}`;
  }, [theme, widgetLocale, heroForm]);

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
        <p>{t(Msg.admin.appearance.subtitle)}</p>
      </div>
      {isLoading ? (
        <p className="px-4 py-6 nc-text-muted">{t(Msg.common.loading)}</p>
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
          <div className="space-y-3 rounded-admin border border-border p-4">
            <div>
              <h3 className="text-sm font-medium text-fg">{t(Msg.admin.appearance.heroTitle)}</h3>
              <p className="mt-1 text-sm nc-text-muted">{t(Msg.admin.appearance.heroSubtitle)}</p>
            </div>
            <div className="block text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={heroForm.show_title}
                  onChange={(event) => updateHeroField('show_title', event.target.checked)}
                />
                <HelpLabel
                  className="font-medium text-fg"
                  label={heroToggleCopy.showTitle}
                  help={heroToggleCopy.showTitleHelp}
                />
              </div>
              <input
                className="nc-input"
                type="text"
                value={heroForm.title}
                onChange={(event) => updateHeroField('title', event.target.value)}
                placeholder={t(Msg.admin.appearance.heroWelcomeTitlePlaceholder)}
                disabled={!heroForm.show_title}
              />
            </div>
            <div className="block text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={heroForm.show_description}
                  onChange={(event) => updateHeroField('show_description', event.target.checked)}
                />
                <HelpLabel
                  className="font-medium text-fg"
                  label={heroToggleCopy.showDescription}
                  help={heroToggleCopy.showDescriptionHelp}
                />
              </div>
              <textarea
                className="nc-input min-h-20 resize-y"
                value={heroForm.description}
                onChange={(event) => updateHeroField('description', event.target.value)}
                placeholder={t(Msg.admin.appearance.heroWelcomeDescriptionPlaceholder)}
                disabled={!heroForm.show_description}
              />
            </div>
            <div className="block text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={heroForm.show_cta}
                  onChange={(event) => updateHeroField('show_cta', event.target.checked)}
                />
                <HelpLabel
                  className="font-medium text-fg"
                  label={heroToggleCopy.showCta}
                  help={heroToggleCopy.showCtaHelp}
                />
              </div>
              <input
                className="nc-input"
                type="text"
                value={heroForm.cta_label}
                onChange={(event) => updateHeroField('cta_label', event.target.value)}
                placeholder={t(Msg.admin.appearance.heroCtaLabelPlaceholder)}
                disabled={!heroForm.show_cta}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
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
            <label className="block text-sm">
              <span className="font-medium text-fg">
                {t(resolveMsgKey(Msg.admin.appearance.maxWidth, 'admin.appearance.maxWidth'))}
              </span>
              <input
                className="nc-input"
                type="text"
                value={theme.max_width}
                onChange={(event) => updateThemeField('max_width', event.target.value)}
                placeholder="480px"
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
          <EmbedSnippetSection />
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
          className="h-10 w-12 shrink-0 cursor-pointer rounded-admin border border-border-strong"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className="nc-input min-w-0 max-w-[7rem] flex-1 font-mono text-xs"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}
