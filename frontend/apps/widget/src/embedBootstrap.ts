const mountId = 'nene-corpus-widget-root';

export function findWidgetScript(): HTMLScriptElement | null {
  const scripts = document.querySelectorAll('script[data-endpoint]');
  const last = scripts.item(scripts.length - 1);

  return last instanceof HTMLScriptElement ? last : null;
}

export function resolveWidgetAssetBase(script: HTMLScriptElement): string | null {
  const src = script.getAttribute('src');

  if (src === null || src === '') {
    return null;
  }

  if (!/\/widget\.js(?:\?.*)?$/.test(src)) {
    return null;
  }

  return src.replace(/\/widget\.js(?:\?.*)?$/, '');
}

export function ensureStylesheet(base: string): void {
  const href = `${base}/widget.css`;

  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`) !== null) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export function ensureMountContainer(script: HTMLScriptElement): HTMLElement {
  const existing = document.getElementById(mountId);

  if (existing instanceof HTMLElement) {
    return existing;
  }

  const container = document.createElement('div');
  container.id = mountId;
  script.insertAdjacentElement('afterend', container);

  return container;
}

export function prepareEmbedMount(): HTMLElement | null {
  const script = findWidgetScript();

  if (script === null) {
    return document.getElementById(mountId);
  }

  const base = resolveWidgetAssetBase(script);

  if (base !== null) {
    ensureStylesheet(base);
  }

  return ensureMountContainer(script);
}
