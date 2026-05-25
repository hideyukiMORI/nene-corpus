import { Msg, resolveMsgKey, useMsg } from '@nene-corpus/i18n';
import { ADMIN_HELP_SECTIONS } from './helpSections';

export function HelpPanel() {
  const t = useMsg();

  return (
    <section id="admin-help" className="nc-panel scroll-mt-24">
      <div className="nc-panel-head">
        <h2 className="font-medium">{t(resolveMsgKey(Msg.admin.help?.title, 'admin.help.title'))}</h2>
        <p>{t(resolveMsgKey(Msg.admin.help?.subtitle, 'admin.help.subtitle'))}</p>
      </div>
      <div className="space-y-3 px-4 py-4">
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
              <p className="whitespace-pre-line nc-text-subtle">{t(section.bodyKey)}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
