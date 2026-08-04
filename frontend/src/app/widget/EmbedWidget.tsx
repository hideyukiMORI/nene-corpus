import { FormEvent, useEffect, useRef, useState } from 'react';
import type { WidgetChat, WidgetHero, WidgetLayout, WidgetTheme } from '@/shared/api';
import { DEFAULT_WIDGET_CHAT, DEFAULT_WIDGET_HERO, DEFAULT_WIDGET_LAYOUT } from '@/shared/api';
import { Msg, useMsg } from '@/shared/i18n';
import { nc } from '@/shared/config/widget-tokens';
import { ChatHero } from './ChatHero';
import { ChatMessageRow, ChatPendingRow } from './ChatMessageRow';
import { hasHeroContent, resolveHeroDisplay } from './resolveHeroDisplay';
import { useChatSession } from './useChatSession';
import { applyWidgetHeroSpacing, applyWidgetTheme } from './theme';

export interface EmbedWidgetProps {
  apiBase?: string;
  theme?: WidgetTheme;
  hero?: WidgetHero;
  chat?: WidgetChat;
  layout?: WidgetLayout;
  /** When true, render only the chat panel (theme/layout applied by a parent shell). */
  bare?: boolean;
}

export function EmbedWidget({
  apiBase,
  theme,
  hero,
  chat,
  layout: _layout = DEFAULT_WIDGET_LAYOUT,
  bare = false,
}: EmbedWidgetProps = {}) {
  const t = useMsg();
  const rootRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { turns, isLoading, isReady, error, sendMessage } = useChatSession({ apiBase });
  const [draft, setDraft] = useState('');
  const resolvedHero: WidgetHero = hero ?? DEFAULT_WIDGET_HERO;
  const resolvedChat: WidgetChat = chat ?? DEFAULT_WIDGET_CHAT;

  useEffect(() => {
    if (bare || rootRef.current === null || theme === undefined) {
      return;
    }

    applyWidgetTheme(rootRef.current, theme);
    applyWidgetHeroSpacing(rootRef.current, resolvedHero);
  }, [bare, theme, resolvedHero]);

  useEffect(() => {
    const container = messagesRef.current;

    if (container !== null) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [turns, isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const content = draft;
    setDraft('');
    await sendMessage(content);
  }

  function focusInput(): void {
    inputRef.current?.focus();
  }

  const heroDisplay = resolveHeroDisplay(resolvedHero, t);
  const showHero = turns.length === 0 && !isLoading && hasHeroContent(heroDisplay);

  const panel = (
    <section className={nc.chatPanel} aria-label={t(Msg.widget.chat.panelLabel)}>
      {showHero && <ChatHero hero={resolvedHero} apiBase={apiBase} onCtaClick={focusInput} />}
      <div ref={messagesRef} className={nc.chatMessages} aria-live="polite">
        {turns.map((turn) => (
          <ChatMessageRow key={turn.id} turn={turn} chat={resolvedChat} apiBase={apiBase} />
        ))}
        {isLoading && <ChatPendingRow chat={resolvedChat} apiBase={apiBase} />}
      </div>
      {error !== null && <p className={nc.chatError}>{error}</p>}
      <form className={nc.chatForm} onSubmit={(event) => void handleSubmit(event)}>
        <input
          ref={inputRef}
          className={nc.chatInput}
          type="text"
          placeholder={t(Msg.widget.chat.inputPlaceholder)}
          aria-label={t(Msg.widget.chat.inputLabel)}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!isReady || isLoading}
        />
        <button className={nc.chatSubmit} type="submit" disabled={!isReady || isLoading}>
          {t(Msg.widget.chat.send)}
        </button>
      </form>
    </section>
  );

  if (bare) {
    return panel;
  }

  return (
    <div ref={rootRef} className={nc.widgetRoot}>
      {panel}
    </div>
  );
}
