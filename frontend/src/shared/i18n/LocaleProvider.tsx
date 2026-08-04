import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getMessageCatalog } from './catalog';
import { resolveInitialLocale, writeStoredLocale } from './locale';
import { translate } from './translate';
import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type MessageParams,
  type MsgKey,
  type SupportedLocale,
} from './types';

export interface LocaleContextValue {
  locale: SupportedLocale;
  supportedLocales: readonly SupportedLocale[];
  setLocale: (locale: SupportedLocale) => void;
  t: (key: MsgKey, params?: MessageParams) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface LocaleProviderProps {
  children: ReactNode;
  storageKey?: string;
  initialLocale?: SupportedLocale;
}

export function LocaleProvider({
  children,
  storageKey = LOCALE_STORAGE_KEY,
  initialLocale,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(
    () => initialLocale ?? resolveInitialLocale(storageKey),
  );

  const setLocale = useCallback(
    (nextLocale: SupportedLocale) => {
      setLocaleState(nextLocale);
      writeStoredLocale(storageKey, nextLocale);
    },
    [storageKey],
  );

  const value = useMemo<LocaleContextValue>(() => {
    const catalog = getMessageCatalog(locale);
    const fallbackCatalog = locale === 'en' ? undefined : getMessageCatalog('en');

    return {
      locale,
      supportedLocales: SUPPORTED_LOCALES,
      setLocale,
      t: (key, params) => translate(catalog, key, params, fallbackCatalog),
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (context === null) {
    throw new Error('useLocaleContext must be used within LocaleProvider.');
  }

  return context;
}
