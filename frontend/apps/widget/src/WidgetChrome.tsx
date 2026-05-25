import { useEffect, useRef, useState } from 'react';
import type { WidgetChat, WidgetHero, WidgetLayout, WidgetTheme } from '@nene-corpus/api-client/types';
import { DEFAULT_WIDGET_LAYOUT } from '@nene-corpus/api-client/types';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { nc } from '@nene-corpus/tokens';
import { EmbedWidget } from './EmbedWidget';
import { applyWidgetLayout, isFixedLayout } from './layout';
import { applyWidgetHeroSpacing, applyWidgetTheme } from './theme';

export interface WidgetChromeProps {
  apiBase?: string;
  theme: WidgetTheme;
  hero: WidgetHero;
  chat: WidgetChat;
  layout?: WidgetLayout;
}

function ChatLauncherIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
      />
    </svg>
  );
}

export function WidgetChrome({
  apiBase,
  theme,
  hero,
  chat,
  layout = DEFAULT_WIDGET_LAYOUT,
}: WidgetChromeProps) {
  const t = useMsg();
  const rootRef = useRef<HTMLDivElement>(null);
  const fixed = isFixedLayout(layout);
  const usesLauncher = fixed && layout.floating_launcher;
  const [isOpen, setIsOpen] = useState(!usesLauncher);

  useEffect(() => {
    if (rootRef.current === null) {
      return;
    }

    applyWidgetTheme(rootRef.current, theme);
    applyWidgetHeroSpacing(rootRef.current, hero);
    applyWidgetLayout(rootRef.current, layout);
  }, [theme, hero, layout]);

  useEffect(() => {
    if (!usesLauncher) {
      setIsOpen(true);
    }
  }, [usesLauncher]);

  const showPanel = !usesLauncher || isOpen;

  return (
    <div ref={rootRef} className={nc.widgetRoot}>
      {showPanel && (
        <div className="nene-corpus-widget__panel">
          {usesLauncher && (
            <button
              type="button"
              className={nc.chatClose}
              onClick={() => setIsOpen(false)}
              aria-label={t(Msg.widget.chat.closeLauncher)}
            >
              ×
            </button>
          )}
          <EmbedWidget apiBase={apiBase} theme={theme} hero={hero} chat={chat} layout={layout} bare />
        </div>
      )}
      {usesLauncher && !isOpen && (
        <button
          type="button"
          className={nc.chatLauncher}
          onClick={() => setIsOpen(true)}
          aria-label={t(Msg.widget.chat.openLauncher)}
          aria-expanded={isOpen}
        >
          <ChatLauncherIcon />
        </button>
      )}
    </div>
  );
}
