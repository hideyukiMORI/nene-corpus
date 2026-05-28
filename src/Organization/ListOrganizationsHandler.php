<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ListOrganizationsHandler
{
    public function __construct(
        private ListOrganizationsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $output = $this->useCase->execute(new ListOrganizationsInput());

        return $this->response->create([
            'organizations' => array_map(
                static fn (Organization $org) => self::serialize($org),
                $output->organizations,
            ),
        ]);
    }

    /** @return array<string, mixed> */
    private static function serialize(Organization $org): array
    {
        return [
            'id'            => $org->id,
            'name'          => $org->name,
            'slug'          => $org->slug,
            'custom_domain' => $org->customDomain,
            'external_id'   => $org->externalId,
            'plan'          => $org->plan,
            'is_active'     => $org->isActive,
            'created_at'    => $org->createdAt,
            'updated_at'    => $org->updatedAt,
        ];
    }
}
