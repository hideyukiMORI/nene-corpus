import type { WidgetHero } from '@nene-corpus/api-client';
import { Msg, resolveMsgKey, useMsg } from '@nene-corpus/i18n';
import { nc } from '@nene-corpus/tokens';

export interface ChatHeroProps {
  hero: WidgetHero;
  onCtaClick: () => void;
}

export function ChatHero({ hero, onCtaClick }: ChatHeroProps) {
  const t = useMsg();
  const title =
    hero.title?.trim() ||
    t(resolveMsgKey(Msg.widget.hero?.defaultTitle, 'widget.hero.defaultTitle'));
  const description =
    hero.description?.trim() ||
    t(resolveMsgKey(Msg.widget.hero?.defaultDescription, 'widget.hero.defaultDescription'));
  const ctaLabel =
    hero.cta_label?.trim() || t(resolveMsgKey(Msg.widget.hero?.cta, 'widget.hero.cta'));

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
