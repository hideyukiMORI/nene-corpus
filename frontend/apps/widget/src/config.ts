const SESSION_STORAGE_KEY = 'nene-corpus.session_token';

export interface WidgetConfig {
  apiBase: string;
}

export function resolveWidgetConfig(override?: Partial<WidgetConfig>): WidgetConfig {
  const fromScript = readEndpointFromScriptTag();

  return {
    apiBase: override?.apiBase ?? fromScript ?? '',
  };
}

function readEndpointFromScriptTag(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const current = document.currentScript;

  if (current instanceof HTMLScriptElement) {
    return normalizeBase(current.dataset.endpoint ?? null);
  }

  const scripts = document.querySelectorAll('script[data-endpoint]');
  const last = scripts.item(scripts.length - 1);

  if (last instanceof HTMLScriptElement) {
    return normalizeBase(last.dataset.endpoint ?? null);
  }

  return null;
}

function normalizeBase(value: string | null): string | null {
  if (value === null || value.trim() === '') {
    return null;
  }

  return value.replace(/\/+$/, '');
}

export function loadStoredSessionToken(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

export function storeSessionToken(token: string): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, token);
}
