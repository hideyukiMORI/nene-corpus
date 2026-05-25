import type { MsgKey } from '@nene-corpus/i18n';

export interface HelpSectionDef {
  titleKey: MsgKey;
  bodyKey: MsgKey;
}

/** Literal keys — do not read `Msg.admin.help` at module init (Vite HMR may serve stale `keys.ts`). */
export const ADMIN_HELP_SECTIONS: HelpSectionDef[] = [
  { titleKey: 'admin.help.quickStart.title', bodyKey: 'admin.help.quickStart.body' },
  { titleKey: 'admin.help.ingestion.title', bodyKey: 'admin.help.ingestion.body' },
  { titleKey: 'admin.help.embed.title', bodyKey: 'admin.help.embed.body' },
  { titleKey: 'admin.help.appearance.title', bodyKey: 'admin.help.appearance.body' },
  { titleKey: 'admin.help.troubleshooting.title', bodyKey: 'admin.help.troubleshooting.body' },
  { titleKey: 'admin.help.faq.title', bodyKey: 'admin.help.faq.body' },
];
