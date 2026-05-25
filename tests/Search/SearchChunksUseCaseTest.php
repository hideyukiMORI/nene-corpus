<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Search;

use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Search\ChunkSearchRepositoryInterface;
use NeneCorpus\Search\ChunkSearchResult;
use NeneCorpus\Search\SearchChunksInput;
use NeneCorpus\Search\SearchChunksUseCase;
use PHPUnit\Framework\TestCase;

final class SearchChunksUseCaseTest extends TestCase
{
    public function test_execute_returns_empty_for_blank_query(): void
    {
        $search = $this->createMock(ChunkSearchRepositoryInterface::class);
        $search->expects(self::never())->method('search');

        $results = (new SearchChunksUseCase($search))->execute(new SearchChunksInput(query: '   '));

        self::assertSame([], $results);
    }

    public function test_execute_clamps_limit_before_search(): void
    {
        $chunk = new Chunk(
            documentId: 1,
            sourceId: 1,
            content: 'Safety instructions.',
        );

        $search = $this->createMock(ChunkSearchRepositoryInterface::class);
        $search->expects(self::once())
            ->method('search')
            ->with('safety', 50)
            ->willReturn([new ChunkSearchResult(chunk: $chunk, score: 1)]);

        $results = (new SearchChunksUseCase($search))->execute(new SearchChunksInput(query: 'safety', limit: 999));

        self::assertCount(1, $results);
    }
}
