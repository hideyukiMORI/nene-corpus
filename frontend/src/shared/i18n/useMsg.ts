import { useLocaleContext } from './LocaleProvider';
import type { MessageParams, MsgKey } from './types';

export function useMsg(): (key: MsgKey, params?: MessageParams) => string {
  return useLocaleContext().t;
}

export function useLocale() {
  const { locale, setLocale, supportedLocales } = useLocaleContext();

  return { locale, setLocale, supportedLocales };
}
