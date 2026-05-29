<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ListSourcesHandler
{
    public function __construct(
        private ListSourcesUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $query = $request->getQueryParams();
        $limit = isset($query['limit']) ? (int) $query['limit'] : 50;
        $offset = isset($query['offset']) ? (int) $query['offset'] : 0;

        $output = $this->useCase->execute(new ListSourcesInput(limit: $limit, offset: $offset));

        return $this->response->create([
            'sources' => array_map(
                static fn (SourceSummary $summary): array => [
                    'source_id' => $summary->source->id,
                    'name' => $summary->source->name,
                    'source_type' => $summary->source->sourceType->value,
                    'status' => $summary->source->status->value,
                    'note' => $summary->source->note,
                    'document_count' => $summary->documentCount,
                    'chunk_count' => $summary->chunkCount,
                    'created_at' => $summary->source->createdAt,
                    'updated_at' => $summary->source->updatedAt,
                ],
                $output->sources,
            ),
            'total' => $output->total,
        ]);
    }
}
