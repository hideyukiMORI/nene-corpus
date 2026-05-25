import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../themes/default.css';
import { EmbedWidget } from './EmbedWidget';
import './widget.css';

const mountId = 'nene-corpus-widget-root';

export function init(target: HTMLElement): void {
  createRoot(target).render(
    <StrictMode>
      <EmbedWidget />
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
