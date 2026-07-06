<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Tenancy;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use Nene2\Error\ProblemDetailsResponseFactory;
use NeneCorpus\Organization\PdoOrganizationRepository;
use NeneCorpus\SystemConfig\PdoSystemConfigRepository;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tenancy\Resolution\OrgResolverMiddleware;
use NeneCorpus\Tests\Support\FixedClock;
use NeneCorpus\Tests\Support\TenancySchemaSetup;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class OrgResolverMiddlewareTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private RequestScopedOrgIdHolder $holder;

    private OrgResolverMiddleware $middleware;

    protected function setUp(): void
    {
        $this->executor = new PdoDatabaseQueryExecutor(new PdoConnectionFactory(new DatabaseConfig(
            null,
            'test',
            'sqlite',
            'localhost',
            1,
            ':memory:',
            'nene_corpus',
            '',
            'utf8',
        )));

        TenancySchemaSetup::createOrganizations($this->executor);
        TenancySchemaSetup::createSystemConfig($this->executor);
        TenancySchemaSetup::seedDefaultOrganization($this->executor);
        TenancySchemaSetup::seedSystemConfig($this->executor);

        $psr17 = new Psr17Factory();

        $this->holder = new RequestScopedOrgIdHolder();
        $this->middleware = new OrgResolverMiddleware(
            $this->holder,
            new PdoOrganizationRepository($this->executor, new FixedClock()),
            new PdoSystemConfigRepository($this->executor, new FixedClock()),
            new ProblemDetailsResponseFactory($psr17, $psr17, 'https://nene-corpus.example'),
        );
    }

    public function test_single_mode_resolves_default_org(): void
    {
        $request = new ServerRequest('GET', 'http://localhost/admin/sources');

        $handler = $this->createPassThroughHandler();
        $response = $this->middleware->process($request, $handler);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(1, $this->holder->getId());
    }

    public function test_bypass_path_health_skips_resolution(): void
    {
        $request = new ServerRequest('GET', 'http://localhost/health');

        $handler = $this->createPassThroughHandler();
        $this->middleware->process($request, $handler);

        // holder should not be set for bypass paths
        self::assertNull($this->holder->getId());
    }

    public function test_bypass_path_admin_auth_skips_resolution(): void
    {
        $request = new ServerRequest('POST', 'http://localhost/admin/auth/login');

        $handler = $this->createPassThroughHandler();
        $this->middleware->process($request, $handler);

        self::assertNull($this->holder->getId());
    }

    public function test_bypass_path_superadmin_skips_resolution(): void
    {
        $request = new ServerRequest('GET', 'http://localhost/admin/superadmin/organizations');

        $handler = $this->createPassThroughHandler();
        $this->middleware->process($request, $handler);

        self::assertNull($this->holder->getId());
    }

    public function test_resolved_org_attributes_are_set_on_request(): void
    {
        $handler = new class () implements RequestHandlerInterface {
            public ?ServerRequestInterface $captured = null;

            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                $this->captured = $request;

                return (new Psr17Factory())->createResponse(200);
            }
        };

        $request = new ServerRequest('GET', 'http://localhost/admin/sources');
        $this->middleware->process($request, $handler);

        self::assertNotNull($handler->captured);
        self::assertSame(1, $handler->captured->getAttribute('nene-corpus.org.id'));
        self::assertSame('default', $handler->captured->getAttribute('nene-corpus.org.slug'));
    }

    public function test_inactive_org_returns_403(): void
    {
        // Deactivate the default org
        $this->executor->execute('UPDATE organizations SET is_active = 0 WHERE id = 1', []);

        $request = new ServerRequest('GET', 'http://localhost/admin/sources');
        $handler = $this->createPassThroughHandler();

        $response = $this->middleware->process($request, $handler);

        self::assertSame(403, $response->getStatusCode());
    }

    private function createPassThroughHandler(): RequestHandlerInterface
    {
        return new class () implements RequestHandlerInterface {
            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return (new Psr17Factory())->createResponse(200);
            }
        };
    }
}
