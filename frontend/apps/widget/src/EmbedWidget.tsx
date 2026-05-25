import { FormEvent, useEffect, useRef, useState } from 'react';
import type { WidgetTheme } from '@nene-corpus/api-client';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { nc } from '@nene-corpus/tokens';
import { useChatSession } from './useChatSession';
import { applyWidgetTheme } from './theme';

export interface EmbedWidgetProps {
  apiBase?: string;
  theme?: WidgetTheme;
}

export function EmbedWidget({ apiBase, theme }: EmbedWidgetProps = {}) {
  const t = useMsg();
  const rootRef = useRef<HTMLDivElement>(null);
  const { turns, isLoading, isReady, error, sendMessage } = useChatSession({ apiBase });
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (rootRef.current !== null && theme !== undefined) {
      applyWidgetTheme(rootRef.current, theme);
    }
  }, [theme]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const content = draft;
    setDraft('');
    await sendMessage(content);
  }

  return (
    <div ref={rootRef} className={nc.widgetRoot}>
      <section className={nc.chatPanel} aria-label={t(Msg.widget.chat.panelLabel)}>
        <div className={nc.chatMessages} aria-live="polite">
          {turns.length === 0 && (
            <div className={`${nc.chatBubble} ${nc.chatBubbleAssistant}`}>
              {t(Msg.widget.chat.emptyPrompt)}
            </div>
          )}
          {turns.map((turn) => (
            <article
              key={turn.id}
              className={`${nc.chatBubble} ${
                turn.role === 'user' ? nc.chatBubbleUser : nc.chatBubbleAssistant
              }`}
            >
              <p className={nc.chatBubbleText}>{turn.content}</p>
              {turn.citations !== undefined && turn.citations.length > 0 && (
                <ul className={nc.chatCitations}>
                  {turn.citations.map((citation) => (
                    <li key={citation.chunk_id} className={nc.chatCitation}>
                      <span className={nc.chatCitationExcerpt}>{citation.excerpt}</span>
                      {citation.page_number !== undefined && (
                        <span className={nc.chatCitationMeta}>
                          {t(Msg.widget.chat.citationPage, { page: citation.page_number })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
          {isLoading && (
            <div className={`${nc.chatBubble} ${nc.chatBubbleAssistant} ${nc.chatBubblePending}`}>
              {t(Msg.widget.chat.loading)}
            </div>
          )}
        </div>
        {error !== null && <p className={nc.chatError}>{error}</p>}
        <form className={nc.chatForm} onSubmit={(event) => void handleSubmit(event)}>
          <input
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
