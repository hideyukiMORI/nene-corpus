<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UpdateOrganizationHandler
{
    public function __construct(
        private UpdateOrganizationUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $id   = (int) ($request->getAttribute('id') ?? 0);
        $body = JsonRequestBodyParser::parse($request);

        $name         = trim((string) ($body['name'] ?? ''));
        $slug         = trim((string) ($body['slug'] ?? ''));
        $plan         = trim((string) ($body['plan'] ?? 'free'));
        $isActive     = isset($body['is_active']) ? (bool) $body['is_active'] : true;
        $customDomain = isset($body['custom_domain']) ? trim((string) $body['custom_domain']) : null;
        $externalId   = isset($body['external_id']) ? trim((string) $body['external_id']) : null;

        $errors = [];

        if ($name === '') {
            $errors[] = new ValidationError('name', 'Name is required.', 'required');
        }

        if ($slug === '') {
            $errors[] = new ValidationError('slug', 'Slug is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $output = $this->useCase->execute(new UpdateOrganizationInput(
            id: $id,
            name: $name,
            slug: $slug,
            plan: $plan,
            isActive: $isActive,
            customDomain: $customDomain !== '' ? $customDomain : null,
            externalId: $externalId !== '' ? $externalId : null,
        ));

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
