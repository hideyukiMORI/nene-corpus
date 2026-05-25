<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ListDocumentChunksHandler
{
    public function __construct(
        private ListDocumentChunksUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $chunks = $this->useCase->execute($id);

        return $this->response->create([
            'chunks' => array_map(
                static fn (DocumentChunkPreview $chunk): array => $chunk->toArray(),
                $chunks,
            ),
        ]);
    }
}
