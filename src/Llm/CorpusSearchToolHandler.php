<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

use NeneCorpus\Search\ChunkSearchResult;
use NeneCorpus\Search\SearchChunksInput;
use NeneCorpus\Search\SearchChunksUseCaseInterface;

final readonly class CorpusSearchToolHandler
{
    private const EXCERPT_MAX_LENGTH = 240;

    private const SEARCH_LIMIT = 5;

    public function __construct(
        private SearchChunksUseCaseInterface $search,
    ) {
    }

    /**
     * @return array{tool_result: string, citations: list<Citation>}
     */
    public function execute(string $query): array
    {
        $results = $this->search->execute(new SearchChunksInput(query: $query, limit: self::SEARCH_LIMIT));

        if ($results === []) {
            return [
                'tool_result' => 'No matching corpus chunks were found.',
                'citations' => [],
            ];
        }

        $citations = array_map(
            fn (ChunkSearchResult $result): Citation => $this->toCitation($result),
            $results,
        );

        $lines = array_map(
            static fn (Citation $citation): string => sprintf(
                '- chunk_id=%d document_id=%d source_id=%d excerpt=%s',
                $citation->chunkId,
                $citation->documentId,
                $citation->sourceId,
                $citation->excerpt,
            ),
            $citations,
        );

        return [
            'tool_result' => "Corpus search results:\n" . implode("\n", $lines),
            'citations' => $citations,
        ];
    }

    private function toCitation(ChunkSearchResult $result): Citation
    {
        $chunk = $result->chunk;

        if ($chunk->id === null) {
            throw new \LogicException('Search result chunk id is required.');
        }

        return new Citation(
            chunkId: $chunk->id,
            documentId: $chunk->documentId,
            sourceId: $chunk->sourceId,
            excerpt: $this->excerpt($chunk->content),
            pageNumber: $chunk->pageNumber,
            sectionLabel: $chunk->sectionLabel,
        );
    }

    private function excerpt(string $content): string
    {
        if (mb_strlen($content) <= self::EXCERPT_MAX_LENGTH) {
            return $content;
        }

        return mb_substr($content, 0, self::EXCERPT_MAX_LENGTH - 1) . '…';
    }
}
