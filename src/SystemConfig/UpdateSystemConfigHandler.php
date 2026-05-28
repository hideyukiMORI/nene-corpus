<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UpdateSystemConfigHandler
{
    public function __construct(
        private UpdateSystemConfigUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);

        $mode       = trim((string) ($body['tenant_resolution_mode'] ?? ''));
        $orgSlug    = trim((string) ($body['tenant_org_slug'] ?? ''));
        $baseDomain = trim((string) ($body['tenant_base_domain'] ?? ''));

        $errors = [];

        if ($mode === '') {
            $errors[] = new ValidationError('tenant_resolution_mode', 'Tenant resolution mode is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $output = $this->useCase->execute(new UpdateSystemConfigInput(
            tenantResolutionMode: $mode,
            tenantOrgSlug: $orgSlug,
            tenantBaseDomain: $baseDomain,
        ));

        $config = $output->config;

        return $this->response->create([
            'tenant_resolution_mode' => $config->tenantResolutionMode,
            'tenant_org_slug'        => $config->tenantOrgSlug,
            'tenant_base_domain'     => $config->tenantBaseDomain,
        ]);
    }
}
