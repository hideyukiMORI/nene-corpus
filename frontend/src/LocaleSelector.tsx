import { Msg, useLocale, useMsg, type MsgKey, type SupportedLocale } from '@/shared/i18n';

const LOCALE_LABEL_KEYS: Record<SupportedLocale, MsgKey> = {
  en: Msg.locale.en,
  ja: Msg.locale.ja,
  fr: Msg.locale.fr,
  'zh-Hans': Msg.locale.zhHans,
  'pt-BR': Msg.locale.ptBr,
  de: Msg.locale.de,
};

export function LocaleSelector() {
  const t = useMsg();
  const { locale, setLocale, supportedLocales } = useLocale();

  return (
    <select
      className="nc-select nc-select-compact"
      value={locale}
      aria-label={t(Msg.admin.app.language)}
      onChange={(event) => setLocale(event.target.value as SupportedLocale)}
    >
      {supportedLocales.map((code) => (
        <option key={code} value={code}>
          {t(LOCALE_LABEL_KEYS[code])}
        </option>
      ))}
    </select>
  );
}
