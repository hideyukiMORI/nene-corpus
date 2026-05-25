import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { fetchWidgetAppearance, type WidgetTheme } from '@nene-corpus/api-client';
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
import { DEFAULT_WIDGET_THEME, readPreviewThemeFromSearchParams } from './theme';
import './widget.css';

const mountId = 'nene-corpus-widget-root';

export interface WidgetInitOptions {
  apiBase?: string;
}

function WidgetRoot({ apiBase, theme }: { apiBase?: string; theme: WidgetTheme }) {
  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = toBcp47(locale);
  }, [locale]);

  return <EmbedWidget apiBase={apiBase} theme={theme} />;
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
  const config = resolveWidgetConfig(options);
  const previewTheme = readPreviewThemeFromSearchParams();
  const previewLocale =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('widget_locale') : null;

  let theme: WidgetTheme = DEFAULT_WIDGET_THEME;
  let configuredLocale: string | null = null;

  try {
    const appearance = await fetchWidgetAppearance(config.apiBase);
    theme = appearance.theme;
    configuredLocale = appearance.widget_locale;
  } catch {
    // Keep defaults when appearance API is unavailable.
  }

  if (previewTheme !== null) {
    theme = previewTheme;
  }

  const initialLocale = resolveInitialLocale(previewLocale, configuredLocale);

  createRoot(target).render(
    <StrictMode>
      <LocaleProvider storageKey={WIDGET_LOCALE_STORAGE_KEY} initialLocale={initialLocale}>
        <WidgetRoot apiBase={config.apiBase} theme={theme} />
      </LocaleProvider>
    </StrictMode>,
  );
}

if (import.meta.env.DEV) {
  const container = document.getElementById(mountId);

  if (container) {
    void init(container);
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
