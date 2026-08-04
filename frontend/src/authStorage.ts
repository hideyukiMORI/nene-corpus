import type { TokenStore } from '@hideyukimori/nene2-client';

const TOKEN_STORAGE_KEY = 'nene-corpus.admin_token';

export function loadStoredAdminToken(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeAdminToken(token: string): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * `authStorage` adapted to nene2-client's `TokenStore` contract (issue #339).
 * Same key (`nene-corpus.admin_token`), same `sessionStorage` backend, same
 * three functions above — untouched. This adapter is not wired into
 * `createAdminTransport` today: this app keeps the token in React state
 * (`useAdminAuth`) and passes it explicitly to each `@/shared/api`
 * call, so `packages/api-client/src/transport.ts` builds a throw-away
 * per-call `TokenStore` instead of consulting a shared one. Exported so a
 * future shared `Nene2Transport` instance can read/clear the same storage
 * without another migration.
 */
export const adminTokenStore: TokenStore = {
  getToken: loadStoredAdminToken,
  clearToken: clearAdminToken,
};
