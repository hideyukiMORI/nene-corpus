<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetOrganizationByIdHandler
{
    public function __construct(
        private GetOrganizationByIdUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $id = (int) ($request->getAttribute('id') ?? 0);

        $output = $this->useCase->execute(new GetOrganizationByIdInput(id: $id));
        $org = $output->organization;

        return $this->response->create([
            'id'            => $org->id,
            'name'          => $org->name,
            'slug'          => $org->slug,
            'custom_domain' => $org->customDomain,
            'external_id'   => $org->externalId,
            'plan'          => $org->plan,
            'is_active'     => $org->isActive,
            'created_at'    => $org->createdAt,
            'updated_at'    => $org->updatedAt,
        ]);
    }
}
