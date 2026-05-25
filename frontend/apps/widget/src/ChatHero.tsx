import type { WidgetHero } from '@nene-corpus/api-client';
import { useMsg } from '@nene-corpus/i18n';
import { nc } from '@nene-corpus/tokens';
import { hasHeroContent, resolveHeroDisplay } from './resolveHeroDisplay';

export interface ChatHeroProps {
  hero: WidgetHero;
  apiBase?: string;
  onCtaClick: () => void;
}

export function ChatHero({ hero, apiBase, onCtaClick }: ChatHeroProps) {
  const t = useMsg();
  const display = resolveHeroDisplay(hero, t);

  if (!hasHeroContent(display)) {
    return null;
  }

  const imageSrc = display.imageUrl !== null ? `${apiBase ?? ''}${display.imageUrl}` : null;

  return (
    <header
      className={`${nc.chatHero}${hero.show_divider ? '' : ` ${nc.chatHeroNoDivider}`}`}
    >
      {imageSrc !== null && (
        <img
          className={nc.chatHeroImage}
          src={imageSrc}
          alt={display.imageAlt ?? ''}
        />
      )}
      {display.title !== null && <h2 className={nc.chatHeroTitle}>{display.title}</h2>}
      {display.description !== null && <p className={nc.chatHeroDescription}>{display.description}</p>}
      {display.ctaLabel !== null && (
        <button className={nc.chatHeroCta} type="button" onClick={onCtaClick}>
          {display.ctaLabel}
        </button>
      )}
    </header>
  );
}
