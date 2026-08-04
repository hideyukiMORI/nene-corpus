import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { fetchWidgetAppearance } from '@/shared/api/appearance';
import { DEFAULT_WIDGET_CHAT, DEFAULT_WIDGET_HERO, DEFAULT_WIDGET_LAYOUT } from '@/shared/api/types';
import type { WidgetChat, WidgetHero, WidgetLayout, WidgetTheme } from '@/shared/api/types';
import {
  LocaleProvider,
  WIDGET_LOCALE_STORAGE_KEY,
  normalizeLocale,
  toBcp47,
  useLocale,
  type SupportedLocale,
} from '@/shared/i18n';
import '../../../themes/default.css';
import { WidgetChrome } from './WidgetChrome';
import { prepareEmbedMount } from './embedBootstrap';
import { resolveWidgetConfig } from './config';
import { readPreviewLayoutFromSearchParams } from './layout';
import { DEFAULT_WIDGET_THEME, readPreviewChatFromSearchParams, readPreviewHeroFromSearchParams, readPreviewThemeFromSearchParams } from './theme';
import './widget.css';

const mountedAttr = 'data-nene-corpus-mounted';

export interface WidgetInitOptions {
  apiBase?: string;
}

function WidgetRoot({
  apiBase,
  mountEl,
  theme,
  hero,
  chat,
  layout,
}: {
  apiBase?: string;
  mountEl: HTMLElement;
  theme: WidgetTheme;
  hero: WidgetHero;
  chat: WidgetChat;
  layout: WidgetLayout;
}) {
  const { locale } = useLocale();

  useEffect(() => {
    // 埋め込み widget は <html> を所有しない。lang はテーマスコープと同一の
    // マウントルート要素へ設定する（規約 01 §7-3・会議 R4 AM-18・WCAG 3.1.2）。
    // document.documentElement.lang の書き換えはホスト文書の読み上げ言語を壊すため MUST NOT。
    mountEl.lang = toBcp47(locale);
  }, [locale, mountEl]);

  return <WidgetChrome apiBase={apiBase} theme={theme} hero={hero} chat={chat} layout={layout} />;
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
  const previewChat = readPreviewChatFromSearchParams();
  const previewLocale =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('widget_locale') : null;

  let theme: WidgetTheme = DEFAULT_WIDGET_THEME;
  let hero: WidgetHero = DEFAULT_WIDGET_HERO;
  let chat: WidgetChat = DEFAULT_WIDGET_CHAT;
  let layout: WidgetLayout = DEFAULT_WIDGET_LAYOUT;
  let configuredLocale: string | null = null;

  try {
    const appearance = await fetchWidgetAppearance(config.apiBase);
    theme = appearance.theme;
    hero = appearance.hero;
    chat = appearance.chat;
    layout = appearance.layout;
    configuredLocale = appearance.widget_locale;

    if (appearance.custom_css !== null && appearance.custom_css !== '') {
      const style = document.createElement('style');
      style.setAttribute('data-nene-corpus-custom', '');
      style.textContent = appearance.custom_css;
      document.head.appendChild(style);
    }
  } catch {
    // Keep defaults when appearance API is unavailable.
  }

  const previewLayout = readPreviewLayoutFromSearchParams();

  if (previewTheme !== null) {
    theme = previewTheme;
  }

  if (previewHero !== null) {
    hero = previewHero;
  }

  if (previewChat !== null) {
    chat = previewChat;
  }

  if (previewLayout !== null) {
    layout = previewLayout;
  }

  const initialLocale = resolveInitialLocale(previewLocale, configuredLocale);

  createRoot(target).render(
    <StrictMode>
      <LocaleProvider storageKey={WIDGET_LOCALE_STORAGE_KEY} initialLocale={initialLocale}>
        <WidgetRoot apiBase={config.apiBase} mountEl={target} theme={theme} hero={hero} chat={chat} layout={layout} />
      </LocaleProvider>
    </StrictMode>,
  );
}

function tryAutoInit(): void {
  const container = prepareEmbedMount();

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
