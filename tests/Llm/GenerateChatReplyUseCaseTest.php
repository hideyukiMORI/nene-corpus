<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Llm;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Document\Document;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Llm\CorpusSearchToolHandler;
use NeneCorpus\Llm\GenerateChatReplyInput;
use NeneCorpus\Llm\GenerateChatReplyUseCase;
use NeneCorpus\Llm\StubClaudeMessagesClient;
use NeneCorpus\Search\PdoChunkSearchRepository;
use NeneCorpus\Search\SearchChunksUseCase;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use PHPUnit\Framework\TestCase;

final class GenerateChatReplyUseCaseTest extends TestCase
{
    public function test_execute_returns_grounded_reply_with_citations(): void
    {
        $executor = new PdoDatabaseQueryExecutor(new PdoConnectionFactory(new DatabaseConfig(
            null,
            'test',
            'sqlite',
            'localhost',
            1,
            ':memory:',
            'nene_corpus',
            '',
            'utf8',
        )));

        CorpusSchemaSetup::create($executor);

        $sourceId = (new PdoSourceRepository($executor))->save(new Source(
            name: 'Catalog',
            sourceType: SourceType::Pdf,
            status: SourceStatus::Ready,
            storagePath: 'storage/uploads/catalog.pdf',
        ));

        $documentId = (new PdoDocumentRepository($executor))->save(new Document(
            sourceId: $sourceId,
            title: 'Pairings',
            position: 0,
        ));

        (new PdoChunkRepository($executor))->save(new Chunk(
            documentId: $documentId,
            sourceId: $sourceId,
            content: 'Dry ginjo pairs well with white fish and light seafood dishes.',
            chunkIndex: 0,
            pageNumber: 2,
            sectionLabel: 'Pairings',
        ));

        $search = new SearchChunksUseCase(new PdoChunkSearchRepository($executor));
        $useCase = new GenerateChatReplyUseCase(
            new StubClaudeMessagesClient(),
            new CorpusSearchToolHandler($search),
        );

        $output = $useCase->execute(new GenerateChatReplyInput(
            userMessage: 'What pairs well with seafood?',
        ));

        self::assertStringContainsString('corpus search results', strtolower($output->content));
        self::assertCount(1, $output->citations);
        self::assertSame(2, $output->citations[0]->pageNumber);
        self::assertSame('Pairings', $output->citations[0]->sectionLabel);
    }
}
