import type { SupportedLocale } from './types';

const BCP47_BY_LOCALE: Record<SupportedLocale, string> = {
  en: 'en',
  ja: 'ja',
  fr: 'fr',
  'zh-Hans': 'zh-Hans',
  'pt-BR': 'pt-BR',
  de: 'de',
};

export function toBcp47(locale: SupportedLocale): string {
  return BCP47_BY_LOCALE[locale];
}

export function formatTimestamp(value: string, locale: SupportedLocale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(toBcp47(locale));
}
