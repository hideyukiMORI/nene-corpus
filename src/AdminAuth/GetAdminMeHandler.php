<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetAdminMeHandler
{
    public function __construct(
        private JsonResponseFactory $response,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        /** @var array<string, mixed>|null $claims */
        $claims = $request->getAttribute('nene2.auth.claims');

        if (!is_array($claims)) {
            return $this->problemDetails->create($request, 'unauthorized', 'Unauthorized', 401);
        }

        return $this->response->create([
            'id' => $claims['sub'] ?? null,
            'email' => $claims['email'] ?? null,
            'role' => $claims['role'] ?? null,
        ]);
    }
}
