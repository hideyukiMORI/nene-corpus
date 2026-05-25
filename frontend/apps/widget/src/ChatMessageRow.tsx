import type { Citation } from '@nene-corpus/api-client';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { nc } from '@nene-corpus/tokens';

export interface ChatBubbleTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

function AssistantAvatar() {
  const t = useMsg();

  return (
    <span className={`${nc.chatAvatar} ${nc.chatAvatarAssistant}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path
          fill="currentColor"
          d="M12 3a7 7 0 0 0-7 7v2.1c0 .8.3 1.6.8 2.2L4 19.5V21h16v-1.5l-1.8-5.2c.5-.6.8-1.4.8-2.2V10a7 7 0 0 0-7-7Zm-2.5 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
        />
      </svg>
      <span className="sr-only">{t(Msg.widget.chat.assistantAvatarLabel)}</span>
    </span>
  );
}

function UserAvatar() {
  const t = useMsg();

  return (
    <span className={`${nc.chatAvatar} ${nc.chatAvatarUser}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path
          fill="currentColor"
          d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-3.04 0-5.5 1.57-5.5 3.5V19h11v-1.25c0-1.93-2.46-3.5-5.5-3.5Z"
        />
      </svg>
      <span className="sr-only">{t(Msg.widget.chat.userAvatarLabel)}</span>
    </span>
  );
}

export interface ChatMessageRowProps {
  turn: ChatBubbleTurn;
}

export function ChatMessageRow({ turn }: ChatMessageRowProps) {
  const t = useMsg();
  const isUser = turn.role === 'user';

  return (
    <div className={`${nc.chatRow} ${isUser ? nc.chatRowUser : nc.chatRowAssistant}`}>
      {!isUser && <AssistantAvatar />}
      <article
        className={`${nc.chatBubble} ${isUser ? nc.chatBubbleUser : nc.chatBubbleAssistant}`}
        aria-label={isUser ? t(Msg.role.user) : t(Msg.role.assistant)}
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
      {isUser && <UserAvatar />}
    </div>
  );
}

export function ChatPendingRow() {
  const t = useMsg();

  return (
    <div className={`${nc.chatRow} ${nc.chatRowAssistant}`}>
      <AssistantAvatar />
      <div className={`${nc.chatBubble} ${nc.chatBubbleAssistant} ${nc.chatBubblePending}`}>
        <span className={nc.chatTypingDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {t(Msg.widget.chat.loading)}
      </div>
    </div>
  );
}
