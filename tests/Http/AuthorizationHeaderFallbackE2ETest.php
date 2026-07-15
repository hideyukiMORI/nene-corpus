<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Http;

use Nene2\Auth\TokenIssuerInterface;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\AdminAuth\AdminAuthServiceProvider;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\AdminHttpTestSupport;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * End-to-end proof that the opt-in X-Authorization fallback receiver (NENE2 #1558 /
 * ADR 0019) is wired into this product's runtime pipeline.
 *
 * Front-end fleet clients (`@hideyukimori/nene2-client` v1.1.0) mirror every bearer
 * token into `X-Authorization: Bearer <token>` so that shared hosting (HETEML-type
 * Tier A) — where an upstream proxy strips the standard `Authorization` header before
 * PHP sees it — can still authenticate. `RuntimeServiceProvider` enables the receiver
 * via `enableAuthorizationHeaderFallback: true`, so the framework's
 * AuthorizationHeaderFallbackMiddleware restores `Authorization` from the mirror
 * (only when `Authorization` is absent/empty) at the head of the auth stage, before
 * `AdminBearerTokenMiddleware` runs.
 *
 * `GET /admin/superadmin/organizations` is bearer-protected but is one of
 * `OrgResolverMiddleware::BYPASS_PREFIXES` (`/admin/superadmin/`), so these
 * assertions isolate the credential-restoration behaviour without needing a
 * seeded tenant. The token is issued directly via the admin JWT issuer service
 * (bypassing the DB-backed login use case) with a `superadmin` role claim so the
 * request also clears `SuperadminMiddleware`, which runs immediately after the
 * bearer auth stage.
 *
 * The tests fail if the opt-in flag is removed from RuntimeServiceProvider: a
 * mirror-only request would then never restore `Authorization` and would be
 * rejected as `missing_token`.
 */
final class AuthorizationHeaderFallbackE2ETest extends TestCase
{
    private const PROTECTED_PATH = '/admin/superadmin/organizations';

    private const JWT_SECRET = 'test-x-auth-fallback-jwt-secret';

    private string $databasePath;

    private RequestHandlerInterface $app;

    private TokenIssuerInterface $issuer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-x-auth-fallback-' . uniqid('', true) . '.sqlite';

        $_ENV['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;

        $container = (new RuntimeContainerFactory())->create();

        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);
        AdminHttpTestSupport::seedCorpusSchema($executor);

        $app = $container->get(RequestHandlerInterface::class);
        self::assertInstanceOf(RequestHandlerInterface::class, $app);
        $this->app = $app;

        // Admin JWTs are issued under a named service id (not TokenIssuerInterface::class
        // — see AdminAuthServiceProvider::TOKEN_ISSUER), so the LocalBearerTokenVerifier
        // bound there is fetched directly rather than via the interface.
        $issuer = $container->get(AdminAuthServiceProvider::TOKEN_ISSUER);
        self::assertInstanceOf(TokenIssuerInterface::class, $issuer);
        $this->issuer = $issuer;
    }

    protected function tearDown(): void
    {
        $_ENV['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
        unset(
            $_ENV['DB_ADAPTER'],
            $_SERVER['DB_ADAPTER'],
            $_ENV['DB_NAME'],
            $_SERVER['DB_NAME'],
        );

        if (is_file($this->databasePath)) {
            unlink($this->databasePath);
        }
    }

    /**
     * The mirror end-to-end proof: a valid superadmin bearer token supplied ONLY in
     * the `X-Authorization` header (no standard `Authorization`) is restored by the
     * fallback receiver and accepted by the bearer auth stage — the request passes
     * authentication.
     *
     * The bearer middleware is the only thing that issues a `WWW-Authenticate`
     * challenge; its absence proves authentication succeeded (a non-2xx response
     * here would be downstream — e.g. the org list handler itself — which is out of
     * scope for this transport-level mirror proof).
     */
    public function test_valid_token_in_mirror_only_passes_authentication(): void
    {
        $token = $this->issueSuperadminToken();

        $request = (new Psr17Factory())
            ->createServerRequest('GET', self::PROTECTED_PATH)
            ->withHeader('X-Authorization', 'Bearer ' . $token);

        $response = $this->app->handle($request);

        self::assertSame(
            '',
            $response->getHeaderLine('WWW-Authenticate'),
            'A valid token mirrored only into X-Authorization must pass the bearer auth stage (no challenge issued).',
        );
    }

    /**
     * The auth stage actually receives the mirrored credential: an INVALID token
     * in `X-Authorization` only is rejected as `invalid_token` (the bearer
     * middleware saw a token), NOT `missing_token` — which is only possible if the
     * fallback receiver restored `Authorization` from the mirror before auth ran.
     */
    public function test_invalid_token_in_mirror_only_reaches_bearer_stage_as_invalid_not_missing(): void
    {
        $request = (new Psr17Factory())
            ->createServerRequest('GET', self::PROTECTED_PATH)
            ->withHeader('X-Authorization', 'Bearer not-a-real-token');

        $response = $this->app->handle($request);

        self::assertSame(401, $response->getStatusCode());
        $wwwAuth = $response->getHeaderLine('WWW-Authenticate');
        self::assertStringContainsString('error="invalid_token"', $wwwAuth);
        self::assertStringNotContainsString('error="missing_token"', $wwwAuth);
    }

    /**
     * Baseline / control: with NO credential in either header, the auth stage
     * reports `missing_token`. This is the response a mirror-only request would get
     * if the opt-in fallback were disabled.
     */
    public function test_no_credential_yields_missing_token(): void
    {
        $request = (new Psr17Factory())->createServerRequest('GET', self::PROTECTED_PATH);

        $response = $this->app->handle($request);

        self::assertSame(401, $response->getStatusCode());
        self::assertStringContainsString(
            'error="missing_token"',
            $response->getHeaderLine('WWW-Authenticate'),
        );
    }

    /**
     * The standard header still wins when both are present (byte-for-byte behaviour
     * unchanged on hosting that delivers `Authorization`): a valid standard token
     * authenticates even when an invalid mirror is also sent. If the receiver wrongly
     * preferred the mirror, the bearer stage would reject the invalid token with an
     * `invalid_token` challenge; its absence proves standard-header precedence.
     */
    public function test_standard_authorization_header_takes_precedence_over_mirror(): void
    {
        $token = $this->issueSuperadminToken();

        $request = (new Psr17Factory())
            ->createServerRequest('GET', self::PROTECTED_PATH)
            ->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-Authorization', 'Bearer not-a-real-token');

        $response = $this->app->handle($request);

        self::assertSame('', $response->getHeaderLine('WWW-Authenticate'));
    }

    private function issueSuperadminToken(): string
    {
        $now = time();

        return $this->issuer->issue([
            'sub'    => 'x-auth-fallback-e2e',
            'email'  => 'x-auth-fallback-e2e@example.com',
            'role'   => 'superadmin',
            'org_id' => null,
            'iat'    => $now,
            'exp'    => $now + 3600,
        ]);
    }
}
