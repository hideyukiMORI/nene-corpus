import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LocaleProvider,
  WIDGET_LOCALE_STORAGE_KEY,
  toBcp47,
  useLocale,
} from '@nene-corpus/i18n';
import '../../../themes/default.css';
import { EmbedWidget } from './EmbedWidget';
import './widget.css';

const mountId = 'nene-corpus-widget-root';

export interface WidgetInitOptions {
  apiBase?: string;
}

function WidgetRoot({ apiBase }: { apiBase?: string }) {
  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = toBcp47(locale);
  }, [locale]);

  return <EmbedWidget apiBase={apiBase} />;
}

export function init(target: HTMLElement, options?: WidgetInitOptions): void {
  createRoot(target).render(
    <StrictMode>
      <LocaleProvider storageKey={WIDGET_LOCALE_STORAGE_KEY}>
        <WidgetRoot apiBase={options?.apiBase} />
      </LocaleProvider>
    </StrictMode>,
  );
}

if (import.meta.env.DEV) {
  const container = document.getElementById(mountId);

  if (container) {
    init(container);
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
