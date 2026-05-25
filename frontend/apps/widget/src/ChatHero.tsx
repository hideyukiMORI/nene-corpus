import type { WidgetHero } from '@nene-corpus/api-client';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { nc } from '@nene-corpus/tokens';

export interface ChatHeroProps {
  hero: WidgetHero;
  onCtaClick: () => void;
}

export function ChatHero({ hero, onCtaClick }: ChatHeroProps) {
  const t = useMsg();
  const title = hero.title?.trim() || t(Msg.widget.hero.defaultTitle);
  const description = hero.description?.trim() || t(Msg.widget.hero.defaultDescription);
  const ctaLabel = hero.cta_label?.trim() || t(Msg.widget.hero.cta);

  return (
    <header className={nc.chatHero}>
      <h2 className={nc.chatHeroTitle}>{title}</h2>
      <p className={nc.chatHeroDescription}>{description}</p>
      <button className={nc.chatHeroCta} type="button" onClick={onCtaClick}>
        {ctaLabel}
      </button>
    </header>
  );
}
