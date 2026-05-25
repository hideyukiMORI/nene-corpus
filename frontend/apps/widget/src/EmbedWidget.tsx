import { FormEvent, useState } from 'react';
import { nc } from '@nene-corpus/tokens';
import { useChatSession } from './useChatSession';

export interface EmbedWidgetProps {
  apiBase?: string;
}

export function EmbedWidget({ apiBase }: EmbedWidgetProps = {}) {
  const { turns, isLoading, isReady, error, sendMessage } = useChatSession({ apiBase });
  const [draft, setDraft] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const content = draft;
    setDraft('');
    await sendMessage(content);
  }

  return (
    <div className={nc.widgetRoot}>
      <section className={nc.chatPanel} aria-label="NeNe Corpus chat">
        <div className={nc.chatMessages} aria-live="polite">
          {turns.length === 0 && (
            <div className={`${nc.chatBubble} ${nc.chatBubbleAssistant}`}>
              Ask a question about our products.
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
                        <span className={nc.chatCitationMeta}>p.{citation.page_number}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
          {isLoading && (
            <div className={`${nc.chatBubble} ${nc.chatBubbleAssistant} ${nc.chatBubblePending}`}>
              Searching the corpus…
            </div>
          )}
        </div>
        {error !== null && <p className={nc.chatError}>{error}</p>}
        <form className={nc.chatForm} onSubmit={(event) => void handleSubmit(event)}>
          <input
            className={nc.chatInput}
            type="text"
            placeholder="Type your question…"
            aria-label="Chat message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!isReady || isLoading}
          />
          <button className={nc.chatSubmit} type="submit" disabled={!isReady || isLoading}>
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
