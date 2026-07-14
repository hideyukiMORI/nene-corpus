/**
 * Admin Bearer-path adapter over `@hideyukimori/nene2-client`'s
 * `createNene2Transport` (fleet Stage2b, issue #339).
 *
 * Every domain function in this package (`admin.ts`, `documents.ts`, …)
 * receives its bearer token as an explicit parameter rather than reading it
 * from a shared store, so `createAdminTransport` builds a throw-away
 * transport per call whose `TokenStore` simply returns that token. This keeps
 * every existing function signature (`token: string, …, apiBase = ''`)
 * identical for admin app call sites while routing every request through
 * nene2-client's single `X-Authorization` mirror choke point (needed for
 * Tier A shared-hosting proxies that strip the standard `Authorization`
 * header).
 *
 * Construction is pure/cheap (no I/O) so creating one per call has no
 * meaningful cost for an admin SPA's request volume.
 *
 * Scope: admin's Bearer-token paths only. Widget's `X-Session-Token` path
 * (`chat.ts`) and unauthenticated endpoints (`fetchWidgetAppearance`,
 * `loginAdmin`, …) are untouched — they keep using `fetchJson` directly.
 *
 * `Nene2ClientError` messages are reformatted back into the pre-migration
 * `formatHttpError` shape (`fetch-json.ts`) so existing
 * `catch (e) { setError(e.message) }` call sites across the admin app keep
 * showing field-level validation detail (e.g. `"name: must not be blank"`)
 * instead of only the RFC 9457 top-level `detail`
 * (`"The request body contains invalid values."`). NENE2 backends already
 * emit full Problem Details with a validation `errors[]` array (see
 * `src/Document/DocumentValidationExceptionHandler.php`), so
 * `Nene2ClientError.problem` carries the same data the old hand-rolled
 * parser read — nothing is lost, only the default `.message` layout would
 * otherwise change.
 */
import { createNene2Transport, isNene2ClientError } from '@hideyukimori/nene2-client';
import type {
  BlobDownload,
  TransportRequestOptions,
} from '@hideyukimori/nene2-client';
import { formatHttpError } from './fetch-json';

/** Subset of `Nene2Transport` actually used by this package's admin functions. */
export interface AdminTransport {
  get<T>(path: string, options?: TransportRequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: TransportRequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: TransportRequestOptions): Promise<T>;
  delete<T = void>(path: string, options?: TransportRequestOptions): Promise<T>;
  getBlob(path: string, options?: TransportRequestOptions): Promise<BlobDownload>;
}

async function withLegacyMessage<T>(url: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isNene2ClientError(error)) {
      throw new Error(formatHttpError(error.status, url, error.problem ?? null));
    }
    throw error;
  }
}

/**
 * Build a one-shot admin transport authenticated with `token`. `apiBase` is
 * the same install-base prefix every domain function already accepts.
 */
export function createAdminTransport(token: string, apiBase = ''): AdminTransport {
  const transport = createNene2Transport({
    baseUrl: apiBase,
    tokenStore: { getToken: () => token, clearToken: () => undefined },
  });
  const fullUrl = (path: string): string => `${apiBase}${path}`;

  return {
    get: (path, options) => withLegacyMessage(fullUrl(path), () => transport.get(path, options)),
    post: (path, body, options) =>
      withLegacyMessage(fullUrl(path), () => transport.post(path, body, options)),
    put: (path, body, options) =>
      withLegacyMessage(fullUrl(path), () => transport.put(path, body, options)),
    delete: (path, options) =>
      withLegacyMessage(fullUrl(path), () => transport.delete(path, options)),
    getBlob: (path, options) =>
      withLegacyMessage(fullUrl(path), () => transport.getBlob(path, options)),
  };
}
