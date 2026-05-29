<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetSystemConfigHandler
{
    public function __construct(
        private GetSystemConfigUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $config = $this->useCase->execute();

        return $this->response->create([
            'tenant_resolution_mode' => $config->tenantResolutionMode,
            'tenant_org_slug'        => $config->tenantOrgSlug,
            'tenant_base_domain'     => $config->tenantBaseDomain,
        ]);
    }
}
