import { afterEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@tests/msw/server';
import { createAdminTransport } from './transport';

const TOKEN = 'test.jwt.token';

/**
 * `createAdminTransport` (#339) is corpus's adapter over
 * `@hideyukimori/nene2-client`'s `createNene2Transport` — the fleet-standard
 * transport that mirrors the bearer token onto both `Authorization` and
 * `X-Authorization` on every request (Tier A shared-hosting proxies strip the
 * standard header; see nene-deal #67/#68, nene-vault #118, nene-payout #155).
 * Ported from nene-payout `frontend/src/shared/api/client.test.ts` / nene-vault
 * `frontend/src/shared/api/client.test.ts`, adapted to corpus's
 * `createAdminTransport(token, apiBase)` factory (a token-per-call transport
 * rather than a module-level singleton backed by a shared token store).
 */
describe('createAdminTransport (nene2-client transport adapter, #339)', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('mirrors the bearer token onto both Authorization and X-Authorization on GET/POST/PUT/DELETE', async () => {
    const seen: Record<string, { auth: string | null; xAuth: string | null }> = {};
    function record(name: string) {
      return ({ request }: { request: Request }) => {
        seen[name] = {
          auth: request.headers.get('Authorization'),
          xAuth: request.headers.get('X-Authorization'),
        };
        return HttpResponse.json({ ok: true });
      };
    }

    server.use(
      http.get('*/admin/auth/me', record('get')),
      http.post('*/admin/sources/1/reindex', record('post')),
      http.put('*/admin/sources/1', record('put')),
      http.delete('*/admin/sources/1', record('delete')),
    );

    const transport = createAdminTransport(TOKEN);

    await transport.get('/admin/auth/me');
    await transport.post('/admin/sources/1/reindex', {});
    await transport.put('/admin/sources/1', { note: 'x' });
    await transport.delete('/admin/sources/1');

    for (const method of ['get', 'post', 'put', 'delete']) {
      expect(seen[method]?.auth, `${method} Authorization`).toBe(`Bearer ${TOKEN}`);
      // The proxy-stripping workaround (#339 → nene2-client #102): the mirror
      // must be present on every verb, or requests silently fail
      // authentication behind a Tier A front proxy that strips Authorization.
      expect(seen[method]?.xAuth, `${method} X-Authorization`).toBe(`Bearer ${TOKEN}`);
    }
  });

  it('mirrors both headers on getBlob (CSV export path, analytics.ts buildExportPath)', async () => {
    let authorization: string | null = null;
    let xAuthorization: string | null = null;

    server.use(
      http.get('*/admin/analytics/export', ({ request }) => {
        authorization = request.headers.get('Authorization');
        xAuthorization = request.headers.get('X-Authorization');
        return new HttpResponse('date,count\n', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="export.csv"',
          },
        });
      }),
    );

    const transport = createAdminTransport(TOKEN);
    const { blob, filename } = await transport.getBlob('/admin/analytics/export?format=sessions');

    expect(authorization).toBe(`Bearer ${TOKEN}`);
    expect(xAuthorization).toBe(`Bearer ${TOKEN}`);
    expect(filename).toBe('export.csv');
    expect(await blob.text()).toBe('date,count\n');
  });

  it('prefixes every request with apiBase and still mirrors both headers (Tier A install-base deployments)', async () => {
    let authorization: string | null = null;
    let xAuthorization: string | null = null;

    server.use(
      http.get('https://example.test/corpus/admin/auth/me', ({ request }) => {
        authorization = request.headers.get('Authorization');
        xAuthorization = request.headers.get('X-Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    // Every `packages/api-client` domain function accepts an `apiBase`
    // prefix (Tier A shared hosting installs corpus under a subpath) — this
    // must not bypass the same auth-header choke point as the root path.
    const transport = createAdminTransport(TOKEN, 'https://example.test/corpus');
    await transport.get('/admin/auth/me');

    expect(authorization).toBe(`Bearer ${TOKEN}`);
    expect(xAuthorization).toBe(`Bearer ${TOKEN}`);
  });

  it('rethrows a Problem Details error response via withLegacyMessage (unchanged public shape)', async () => {
    server.use(
      http.get('*/admin/auth/me', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Server Error', status: 500, detail: 'boom' },
          { status: 500 },
        ),
      ),
    );

    const transport = createAdminTransport(TOKEN);

    await expect(transport.get('/admin/auth/me')).rejects.toThrow(/boom/);
  });
});
