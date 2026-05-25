import type { MsgKey } from './types';

/** True when `translate()` fell back to the raw key (missing from the loaded catalog). */
export function isUnresolvedTranslation(text: string, key: MsgKey): boolean {
  return text === key;
}
