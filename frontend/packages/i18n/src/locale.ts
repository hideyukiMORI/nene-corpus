import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from './types';

const LOCALE_ALIASES: Record<string, SupportedLocale> = {
  en: 'en',
  ja: 'ja',
  fr: 'fr',
  de: 'de',
  pt: 'pt-BR',
  'pt-br': 'pt-BR',
  zh: 'zh-Hans',
  'zh-cn': 'zh-Hans',
  'zh-hans': 'zh-Hans',
  'zh-hans-cn': 'zh-Hans',
};

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(input: string): SupportedLocale | null {
  const trimmed = input.trim();

  if (isSupportedLocale(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase().replaceAll('_', '-');
  const alias = LOCALE_ALIASES[lower];

  if (alias !== undefined) {
    return alias;
  }

  const base = lower.split('-')[0] ?? lower;
  const baseAlias = LOCALE_ALIASES[base];

  return baseAlias ?? null;
}

export function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  for (const language of navigator.languages) {
    const normalized = normalizeLocale(language);

    if (normalized !== null) {
      return normalized;
    }
  }

  return DEFAULT_LOCALE;
}

export function readStoredLocale(storageKey: string): SupportedLocale | null {
  try {
    const stored = localStorage.getItem(storageKey);

    if (stored === null) {
      return null;
    }

    return normalizeLocale(stored);
  } catch {
    return null;
  }
}

export function writeStoredLocale(storageKey: string, locale: SupportedLocale): void {
  try {
    localStorage.setItem(storageKey, locale);
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function resolveInitialLocale(storageKey: string): SupportedLocale {
  return readStoredLocale(storageKey) ?? detectBrowserLocale();
}
