/** BEM class names for the embed widget — always use via constants, never inline strings. */
export const nc = {
  widgetRoot: 'nene-corpus-widget',
  chatPanel: 'nene-corpus-chat',
  chatMessages: 'nene-corpus-chat__messages',
  chatBubble: 'nene-corpus-chat__bubble',
  chatBubbleUser: 'nene-corpus-chat__bubble--user',
  chatBubbleAssistant: 'nene-corpus-chat__bubble--assistant',
  chatBubblePending: 'nene-corpus-chat__bubble--pending',
  chatBubbleText: 'nene-corpus-chat__bubble-text',
  chatCitations: 'nene-corpus-chat__citations',
  chatCitation: 'nene-corpus-chat__citation',
  chatCitationExcerpt: 'nene-corpus-chat__citation-excerpt',
  chatCitationMeta: 'nene-corpus-chat__citation-meta',
  chatError: 'nene-corpus-chat__error',
  chatForm: 'nene-corpus-chat__form',
  chatInput: 'nene-corpus-chat__input',
  chatSubmit: 'nene-corpus-chat__submit',
} as const;
