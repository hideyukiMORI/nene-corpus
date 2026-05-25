import { Msg, useLocale, useMsg, type MsgKey, type SupportedLocale } from '@nene-corpus/i18n';

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
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="whitespace-nowrap">{t(Msg.admin.app.language)}</span>
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900"
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
    </label>
  );
}
