import type { SupportedLocale } from '@nene-corpus/i18n';

export interface ChatAppearanceCopy {
  chatTitle: string;
  chatSubtitle: string;
  userAvatarMode: string;
  userAvatarModeHelp: string;
  userAvatarModeSilhouette: string;
  userAvatarModeNone: string;
  showAssistantAvatar: string;
  showAssistantAvatarHelp: string;
}

/**
 * Emergency copy when Vite HMR serves a stale `@nene-corpus/i18n` catalog (raw keys or blank labels).
 * Keep in sync with `packages/i18n/src/locales/*.ts` chat appearance entries.
 */
export const APPEARANCE_CHAT_TOGGLE_FALLBACK: Record<SupportedLocale, ChatAppearanceCopy> = {
  ja: {
    chatTitle: 'チャット吹き出し',
    chatSubtitle: '会話エリアのアイコンと吹き出しの見え方を設定します。',
    userAvatarMode: '訪問者のアイコン',
    userAvatarModeHelp: '訪問者メッセージ横に汎用シルエットを出すか、吹き出しのみにするか選びます。',
    userAvatarModeSilhouette: 'シルエット',
    userAvatarModeNone: 'なし（吹き出しのみ）',
    showAssistantAvatar: 'アシスタントのアイコン',
    showAssistantAvatarHelp: '回答横のアシスタントアイコンの表示／非表示を切り替えます。',
  },
  en: {
    chatTitle: 'Chat bubbles',
    chatSubtitle: 'Control avatars and bubble layout in the conversation area.',
    userAvatarMode: 'Visitor icon',
    userAvatarModeHelp: 'Choose whether visitor messages show a generic silhouette or text only.',
    userAvatarModeSilhouette: 'Silhouette',
    userAvatarModeNone: 'No icon (bubble only)',
    showAssistantAvatar: 'Assistant icon',
    showAssistantAvatarHelp: 'Turn the assistant avatar beside replies on or off.',
  },
  'zh-Hans': {
    chatTitle: '聊天气泡',
    chatSubtitle: '设置对话区头像与气泡布局。',
    userAvatarMode: '访客图标',
    userAvatarModeHelp: '访客消息旁显示通用剪影，或仅显示气泡。',
    userAvatarModeSilhouette: '剪影',
    userAvatarModeNone: '无图标（仅气泡）',
    showAssistantAvatar: '助手图标',
    showAssistantAvatarHelp: '切换助手回复旁图标的显示或隐藏。',
  },
  fr: {
    chatTitle: 'Bulles de chat',
    chatSubtitle: 'Icônes et mise en page des messages dans la zone de conversation.',
    userAvatarMode: 'Icône visiteur',
    userAvatarModeHelp: 'Silhouette générique à côté des messages visiteur, ou bulle seule.',
    userAvatarModeSilhouette: 'Silhouette',
    userAvatarModeNone: 'Aucune (bulle seule)',
    showAssistantAvatar: 'Icône assistant',
    showAssistantAvatarHelp: "Afficher ou masquer l'icône à côté des réponses.",
  },
  'pt-BR': {
    chatTitle: 'Balões de chat',
    chatSubtitle: 'Ícones e layout das mensagens na área de conversa.',
    userAvatarMode: 'Ícone do visitante',
    userAvatarModeHelp: 'Silhueta genérica ao lado das mensagens do visitante, ou só o balão.',
    userAvatarModeSilhouette: 'Silhoueta',
    userAvatarModeNone: 'Nenhum (só balão)',
    showAssistantAvatar: 'Ícone do assistente',
    showAssistantAvatarHelp: 'Ativar ou desativar o ícone ao lado das respostas.',
  },
  de: {
    chatTitle: 'Chat-Sprechblasen',
    chatSubtitle: 'Avatare und Layout im Gesprächsbereich festlegen.',
    userAvatarMode: 'Besucher-Symbol',
    userAvatarModeHelp: 'Generische Silhouette neben Besuchernachrichten oder nur Sprechblase.',
    userAvatarModeSilhouette: 'Silhouette',
    userAvatarModeNone: 'Keins (nur Sprechblase)',
    showAssistantAvatar: 'Assistenten-Symbol',
    showAssistantAvatarHelp: 'Symbol neben Antworten ein- oder ausblenden.',
  },
};
