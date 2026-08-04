import { Msg, useMsg } from '@/shared/i18n';
import type { SettingsSection } from './SettingsModal';

interface SectionCard {
  id: Exclude<SettingsSection, 'overview'>;
  navMsgKey:
    | typeof Msg.admin.app.settingsNavLlm
    | typeof Msg.admin.app.settingsNavChat
    | typeof Msg.admin.app.settingsNavAppearance
    | typeof Msg.admin.app.settingsNavLimits
    | typeof Msg.admin.app.settingsNavNotifications
    | typeof Msg.admin.app.settingsNavAccount;
  descMsgKey:
    | typeof Msg.admin.settingsOverview.llmDesc
    | typeof Msg.admin.settingsOverview.chatDesc
    | typeof Msg.admin.settingsOverview.appearanceDesc
    | typeof Msg.admin.settingsOverview.limitsDesc
    | typeof Msg.admin.settingsOverview.notificationsDesc
    | typeof Msg.admin.settingsOverview.accountDesc;
  icon: string;
}

const SECTION_CARDS: SectionCard[] = [
  {
    id: 'llm',
    navMsgKey: Msg.admin.app.settingsNavLlm,
    descMsgKey: Msg.admin.settingsOverview.llmDesc,
    icon: '🤖',
  },
  {
    id: 'chat',
    navMsgKey: Msg.admin.app.settingsNavChat,
    descMsgKey: Msg.admin.settingsOverview.chatDesc,
    icon: '💬',
  },
  {
    id: 'appearance',
    navMsgKey: Msg.admin.app.settingsNavAppearance,
    descMsgKey: Msg.admin.settingsOverview.appearanceDesc,
    icon: '🎨',
  },
  {
    id: 'limits',
    navMsgKey: Msg.admin.app.settingsNavLimits,
    descMsgKey: Msg.admin.settingsOverview.limitsDesc,
    icon: '🛡️',
  },
  {
    id: 'notifications',
    navMsgKey: Msg.admin.app.settingsNavNotifications,
    descMsgKey: Msg.admin.settingsOverview.notificationsDesc,
    icon: '🔔',
  },
  {
    id: 'account',
    navMsgKey: Msg.admin.app.settingsNavAccount,
    descMsgKey: Msg.admin.settingsOverview.accountDesc,
    icon: '👤',
  },
];

interface SettingsOverviewPanelProps {
  onNavigate: (section: Exclude<SettingsSection, 'overview'>) => void;
}

export function SettingsOverviewPanel({ onNavigate }: SettingsOverviewPanelProps) {
  const t = useMsg();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">{t(Msg.admin.settingsOverview.title)}</h2>
        <p className="mt-1 text-sm nc-text-muted">{t(Msg.admin.settingsOverview.subtitle)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SECTION_CARDS.map(({ id, navMsgKey, descMsgKey, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className="flex items-start gap-4 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-brand/50 hover:bg-brand/5"
          >
            <span className="mt-0.5 text-2xl leading-none" aria-hidden="true">{icon}</span>
            <div className="min-w-0">
              <p className="font-medium text-fg">{t(navMsgKey)}</p>
              <p className="mt-0.5 text-sm nc-text-muted">{t(descMsgKey)}</p>
            </div>
            <span className="ml-auto mt-1 shrink-0 nc-text-muted text-sm">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
