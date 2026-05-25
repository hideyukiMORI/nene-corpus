import type { Msg } from './keys';

/** NENE2 VitePress docs と同じ 6 ロケール。 */
export const SUPPORTED_LOCALES = ['en', 'ja', 'fr', 'zh-Hans', 'pt-BR', 'de'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const LOCALE_STORAGE_KEY = 'nene-corpus.admin.locale';

type LeafValues<T> = T extends string
  ? T
  : T extends Record<string, infer V>
    ? LeafValues<V>
    : never;

/** メッセージカタログのキー — `Msg` 定数の値と一致する。 */
export type MsgKey = LeafValues<typeof Msg>;

export type MessageCatalog = Record<MsgKey, string>;

export type MessageParams = Record<string, string | number>;
