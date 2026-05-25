import type { WidgetHero } from '@nene-corpus/api-client';
import { Msg, resolveMsgKey, type MsgKey } from '@nene-corpus/i18n';

export interface HeroDisplay {
  title: string | null;
  description: string | null;
  ctaLabel: string | null;
}

export function resolveHeroDisplay(hero: WidgetHero, translate: (key: MsgKey) => string): HeroDisplay {
  const title =
    hero.show_title === false
      ? null
      : hero.title?.trim() ||
        translate(resolveMsgKey(Msg.widget.hero?.defaultTitle, 'widget.hero.defaultTitle'));
  const description =
    hero.show_description === false
      ? null
      : hero.description?.trim() ||
        translate(resolveMsgKey(Msg.widget.hero?.defaultDescription, 'widget.hero.defaultDescription'));
  const ctaLabel =
    hero.show_cta === false
      ? null
      : hero.cta_label?.trim() ||
        translate(resolveMsgKey(Msg.widget.hero?.cta, 'widget.hero.cta'));

  return { title, description, ctaLabel };
}

export function hasHeroContent(display: HeroDisplay): boolean {
  return display.title !== null || display.description !== null || display.ctaLabel !== null;
}
