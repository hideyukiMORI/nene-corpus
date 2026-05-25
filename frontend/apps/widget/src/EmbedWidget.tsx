import { FormEvent, useEffect, useRef, useState } from 'react';
import type { WidgetHero, WidgetTheme } from '@nene-corpus/api-client';
import { DEFAULT_WIDGET_HERO } from '@nene-corpus/api-client';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { nc } from '@nene-corpus/tokens';
import { ChatHero } from './ChatHero';
import { ChatMessageRow, ChatPendingRow } from './ChatMessageRow';
import { hasHeroContent, resolveHeroDisplay } from './resolveHeroDisplay';
import { useChatSession } from './useChatSession';
import { applyWidgetTheme } from './theme';

export interface EmbedWidgetProps {
  apiBase?: string;
  theme?: WidgetTheme;
  hero?: WidgetHero;
}

export function EmbedWidget({ apiBase, theme, hero }: EmbedWidgetProps = {}) {
  const t = useMsg();
  const rootRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { turns, isLoading, isReady, error, sendMessage } = useChatSession({ apiBase });
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (rootRef.current !== null && theme !== undefined) {
      applyWidgetTheme(rootRef.current, theme);
    }
  }, [theme]);

  useEffect(() => {
    const container = messagesRef.current;

    if (container !== null) {
      container.scrollTop = container.scrollHeight;
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

  const resolvedHero: WidgetHero = hero ?? DEFAULT_WIDGET_HERO;
  const heroDisplay = resolveHeroDisplay(resolvedHero, t);
  const showHero = turns.length === 0 && !isLoading && hasHeroContent(heroDisplay);

  return (
    <div ref={rootRef} className={nc.widgetRoot}>
      <section className={nc.chatPanel} aria-label={t(Msg.widget.chat.panelLabel)}>
        {showHero && <ChatHero hero={resolvedHero} onCtaClick={focusInput} />}
        <div ref={messagesRef} className={nc.chatMessages} aria-live="polite">
          {turns.map((turn) => (
            <ChatMessageRow key={turn.id} turn={turn} />
          ))}
          {isLoading && <ChatPendingRow />}
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
    </div>
  );
}
