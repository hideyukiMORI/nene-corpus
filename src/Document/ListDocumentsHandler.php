<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ListDocumentsHandler
{
    public function __construct(
        private ListDocumentsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $sourceId = (int) ($parameters['sourceId'] ?? 0);

        $query = $request->getQueryParams();
        $limit = isset($query['limit']) ? (int) $query['limit'] : 100;
        $offset = isset($query['offset']) ? (int) $query['offset'] : 0;

        $summaries = $this->useCase->execute(new ListDocumentsInput(
            sourceId: $sourceId,
            limit: $limit,
            offset: $offset,
        ));

        return $this->response->create([
            'documents' => array_map(
                static fn (DocumentSummary $summary): array => [
                    'document_id' => $summary->document->id,
                    'source_id' => $summary->document->sourceId,
                    'title' => $summary->document->title,
                    'position' => $summary->document->position,
                    'chunk_count' => $summary->chunkCount,
                    'content_preview' => $summary->contentPreview,
                    'created_at' => $summary->document->createdAt,
                    'updated_at' => $summary->document->updatedAt,
                ],
                $summaries,
            ),
        ]);
    }
}
