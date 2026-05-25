import type { MessageCatalog, MsgKey } from './types';

/** 全キーが各ロケールファイルに存在することを型で保証する。 */
export function defineMessages(messages: Record<MsgKey, string>): MessageCatalog {
  return messages;
}
