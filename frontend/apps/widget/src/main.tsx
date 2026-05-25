import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { fetchWidgetAppearance, DEFAULT_WIDGET_HERO, type WidgetHero, type WidgetTheme } from '@nene-corpus/api-client';
import {
  LocaleProvider,
  WIDGET_LOCALE_STORAGE_KEY,
  normalizeLocale,
  toBcp47,
  useLocale,
  type SupportedLocale,
} from '@nene-corpus/i18n';
import '../../../themes/default.css';
import { EmbedWidget } from './EmbedWidget';
import { resolveWidgetConfig } from './config';
import { DEFAULT_WIDGET_THEME, readPreviewHeroFromSearchParams, readPreviewThemeFromSearchParams } from './theme';
import './widget.css';

const mountId = 'nene-corpus-widget-root';
const mountedAttr = 'data-nene-corpus-mounted';

export interface WidgetInitOptions {
  apiBase?: string;
}

function WidgetRoot({ apiBase, theme, hero }: { apiBase?: string; theme: WidgetTheme; hero: WidgetHero }) {
  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = toBcp47(locale);
  }, [locale]);

  return <EmbedWidget apiBase={apiBase} theme={theme} hero={hero} />;
}

function resolveInitialLocale(
  previewLocale: string | null,
  configuredLocale: string | null,
): SupportedLocale | undefined {
  if (previewLocale !== null && previewLocale !== '') {
    return normalizeLocale(previewLocale) ?? undefined;
  }

  if (configuredLocale !== null && configuredLocale !== '') {
    return normalizeLocale(configuredLocale) ?? undefined;
  }

  return undefined;
}

export async function init(target: HTMLElement, options?: WidgetInitOptions): Promise<void> {
  if (target.hasAttribute(mountedAttr)) {
    return;
  }

  target.setAttribute(mountedAttr, '');

  const config = resolveWidgetConfig(options);
  const previewTheme = readPreviewThemeFromSearchParams();
  const previewHero = readPreviewHeroFromSearchParams();
  const previewLocale =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('widget_locale') : null;

  let theme: WidgetTheme = DEFAULT_WIDGET_THEME;
  let hero: WidgetHero = DEFAULT_WIDGET_HERO;
  let configuredLocale: string | null = null;

  try {
    const appearance = await fetchWidgetAppearance(config.apiBase);
    theme = appearance.theme;
    hero = appearance.hero;
    configuredLocale = appearance.widget_locale;
  } catch {
    // Keep defaults when appearance API is unavailable.
  }

  if (previewTheme !== null) {
    theme = previewTheme;
  }

  if (previewHero !== null) {
    hero = previewHero;
  }

  const initialLocale = resolveInitialLocale(previewLocale, configuredLocale);

  createRoot(target).render(
    <StrictMode>
      <LocaleProvider storageKey={WIDGET_LOCALE_STORAGE_KEY} initialLocale={initialLocale}>
        <WidgetRoot apiBase={config.apiBase} theme={theme} hero={hero} />
      </LocaleProvider>
    </StrictMode>,
  );
}

function tryAutoInit(): void {
  const container = document.getElementById(mountId);

  if (container === null || container.hasAttribute(mountedAttr)) {
    return;
  }

  void init(container);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryAutoInit);
  } else {
    tryAutoInit();
  }
}

declare global {
  interface Window {
    NeneCorpusWidget?: {
      init: typeof init;
    };
  }
}

window.NeneCorpusWidget = { init };
