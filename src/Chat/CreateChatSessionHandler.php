<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use Nene2\Http\JsonResponseFactory;
use NeneCorpus\Http\RequestMetadataExtractor;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class CreateChatSessionHandler
{
    public function __construct(
        private CreateChatSessionUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $output = $this->useCase->execute(new CreateChatSessionInput(
            clientIp: RequestMetadataExtractor::clientIp($request),
            userAgent: RequestMetadataExtractor::userAgent($request),
            referer: RequestMetadataExtractor::referer($request),
        ));

        return $this->response->create([
            'session_id' => $output->sessionId,
            'session_token' => $output->sessionToken,
        ], 201);
    }
}
