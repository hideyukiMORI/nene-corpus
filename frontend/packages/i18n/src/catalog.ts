import { de } from './locales/de';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { ja } from './locales/ja';
import { ptBr } from './locales/pt-BR';
import { zhHans } from './locales/zh-Hans';
import type { MessageCatalog, SupportedLocale } from './types';

export const MESSAGE_CATALOGS: Record<SupportedLocale, MessageCatalog> = {
  en,
  ja,
  fr,
  'zh-Hans': zhHans,
  'pt-BR': ptBr,
  de,
};

export function getMessageCatalog(locale: SupportedLocale): MessageCatalog {
  return MESSAGE_CATALOGS[locale];
}
