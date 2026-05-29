<?php

declare(strict_types=1);

namespace NeneCorpus\Organization;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class CreateOrganizationHandler
{
    public function __construct(
        private CreateOrganizationUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);

        $name = trim((string) ($body['name'] ?? ''));
        $slug = trim((string) ($body['slug'] ?? ''));
        $plan = trim((string) ($body['plan'] ?? 'free'));
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

        $output = $this->useCase->execute(new CreateOrganizationInput(
            name: $name,
            slug: $slug,
            plan: $plan,
            customDomain: $customDomain !== '' ? $customDomain : null,
            externalId: $externalId !== '' ? $externalId : null,
        ));

        return $this->response->create(['id' => $output->id], 201);
    }
}
