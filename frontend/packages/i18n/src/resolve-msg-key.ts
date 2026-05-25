import type { MsgKey } from './types';

/** Use when Msg tree may lag behind catalog during Vite HMR (returns a valid MsgKey). */
export function resolveMsgKey(candidate: string | undefined, fallback: MsgKey): MsgKey {
  return (candidate ?? fallback) as MsgKey;
}
