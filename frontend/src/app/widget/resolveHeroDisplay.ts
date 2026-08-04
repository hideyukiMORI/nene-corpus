import type { WidgetHero } from '@/shared/api';
import { Msg, resolveMsgKey, type MsgKey } from '@/shared/i18n';

export interface HeroDisplay {
  imageUrl: string | null;
  imageAlt: string | null;
  title: string | null;
  description: string | null;
  ctaLabel: string | null;
}

export function resolveHeroDisplay(hero: WidgetHero, translate: (key: MsgKey) => string): HeroDisplay {
  const imageUrl =
    hero.show_image === false || !hero.image_url?.trim() ? null : hero.image_url.trim();
  const imageAlt = hero.image_alt?.trim() || null;
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

  return { imageUrl, imageAlt, title, description, ctaLabel };
}

export function hasHeroContent(display: HeroDisplay): boolean {
  return (
    display.imageUrl !== null ||
    display.title !== null ||
    display.description !== null ||
    display.ctaLabel !== null
  );
}
