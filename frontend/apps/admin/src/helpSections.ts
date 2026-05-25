import { Msg, type MsgKey } from '@nene-corpus/i18n';

export interface HelpSectionDef {
  titleKey: MsgKey;
  bodyKey: MsgKey;
}

export const ADMIN_HELP_SECTIONS: HelpSectionDef[] = [
  { titleKey: Msg.admin.help.quickStart.title, bodyKey: Msg.admin.help.quickStart.body },
  { titleKey: Msg.admin.help.ingestion.title, bodyKey: Msg.admin.help.ingestion.body },
  { titleKey: Msg.admin.help.embed.title, bodyKey: Msg.admin.help.embed.body },
  { titleKey: Msg.admin.help.appearance.title, bodyKey: Msg.admin.help.appearance.body },
  { titleKey: Msg.admin.help.troubleshooting.title, bodyKey: Msg.admin.help.troubleshooting.body },
  { titleKey: Msg.admin.help.faq.title, bodyKey: Msg.admin.help.faq.body },
];
