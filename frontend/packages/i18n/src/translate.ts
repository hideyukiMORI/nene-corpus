import type { MessageCatalog, MessageParams, MsgKey } from './types';

export function translate(
  catalog: MessageCatalog,
  key: MsgKey,
  params?: MessageParams,
  fallbackCatalog?: MessageCatalog,
): string {
  let text = catalog[key] ?? fallbackCatalog?.[key] ?? key;

  if (params === undefined) {
    return text;
  }

  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }

  return text;
}
