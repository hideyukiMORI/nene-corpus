<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use Nene2\Http\JsonResponseFactory;
use Nene2\Http\PaginationQueryParser;
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
        // Bound the page size structurally: an unbounded ?limit= is a DoS / limit-injection
        // vector. The parser keeps the historical default of 50 and rejects out-of-range
        // values with 422 (response envelope is intentionally left unchanged here).
        $pagination = PaginationQueryParser::parse($request, defaultLimit: 50, maxLimit: 200);

        $output = $this->useCase->execute(new ListSourcesInput(
            limit: $pagination->limit,
            offset: $pagination->offset,
        ));

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
