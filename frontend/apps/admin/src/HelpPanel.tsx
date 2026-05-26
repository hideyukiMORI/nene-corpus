import { Msg, resolveMsgKey, useLocale, useMsg } from '@nene-corpus/i18n';
import { ADMIN_HELP_SECTIONS } from './helpSections';

/** ロケール → HOWTO セットアップガイド URL のマッピング */
const GUIDE_URL_MAP: Record<string, string> = {
  ja: '/guide/howto/ja/',
  en: '/guide/howto/en/',
  de: '/guide/howto/de/',
  fr: '/guide/howto/fr/',
  'pt-BR': '/guide/howto/pt-br/',
  'zh-Hans': '/guide/howto/zh-hans/',
};

function guideUrl(locale: string): string {
  return GUIDE_URL_MAP[locale] ?? '/guide/en/';
}

export function HelpPanel() {
  const t = useMsg();
  const { locale } = useLocale();

  return (
    <section id="admin-help" className="nc-panel scroll-mt-24">
      <div className="nc-panel-head">
        <h2 className="font-medium">{t(resolveMsgKey(Msg.admin.help?.title, 'admin.help.title'))}</h2>
        <p>{t(resolveMsgKey(Msg.admin.help?.subtitle, 'admin.help.subtitle'))}</p>
      </div>
      <div className="space-y-3 px-4 py-4">
        {/* ガイドリンクカード */}
        <a
          href={guideUrl(locale)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-admin border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-medium text-brand transition-colors hover:bg-brand/20"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden>📖</span>
            <span>
              {t(resolveMsgKey(Msg.admin.help?.guideLink?.label, 'admin.help.guideLink.label'))}
            </span>
          </span>
          <span aria-hidden className="text-xs opacity-70">→</span>
        </a>
        <p className="px-1 text-xs nc-text-muted">
          {t(resolveMsgKey(Msg.admin.help?.guideLink?.description, 'admin.help.guideLink.description'))}
        </p>

        {/* アコーディオン */}
        {ADMIN_HELP_SECTIONS.map((section) => (
          <details
            key={section.titleKey}
            className="group rounded-admin border border-accent-border bg-accent text-xs text-fg-muted"
          >
            <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-fg marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block text-focus transition-transform group-open:rotate-90"
                >
                  ▶
                </span>
                {t(section.titleKey)}
              </span>
            </summary>
            <div className="border-t border-accent-border px-3 py-3 leading-relaxed">
              <p className="nc-help-body whitespace-pre-line">{t(section.bodyKey)}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
