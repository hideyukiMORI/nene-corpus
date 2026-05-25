<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Chunk;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Document\Document;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use PHPUnit\Framework\TestCase;

final class PdoChunkRepositoryTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private int $sourceId;

    private int $documentId;

    protected function setUp(): void
    {
        $this->executor = new PdoDatabaseQueryExecutor(new PdoConnectionFactory(new DatabaseConfig(
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

        CorpusSchemaSetup::create($this->executor);

        $sourceRepository = new PdoSourceRepository($this->executor);
        $this->sourceId = $sourceRepository->save(new Source(
            name: 'Parent source',
            sourceType: SourceType::Pdf,
            status: SourceStatus::Ready,
            storagePath: 'storage/uploads/parent.pdf',
        ));

        $documentRepository = new PdoDocumentRepository($this->executor);
        $this->documentId = $documentRepository->save(new Document(
            sourceId: $this->sourceId,
            title: 'Manual',
            position: 0,
        ));
    }

    public function test_save_and_find_by_id_returns_chunk(): void
    {
        $repository = new PdoChunkRepository($this->executor);
        $id = $repository->save(new Chunk(
            documentId: $this->documentId,
            sourceId: $this->sourceId,
            content: 'Safety instructions for equipment.',
            chunkIndex: 0,
            pageNumber: 3,
            sectionLabel: 'Safety',
            tokenCount: 12,
        ));

        $chunk = $repository->findById($id);

        self::assertNotNull($chunk);
        self::assertSame($this->documentId, $chunk->documentId);
        self::assertSame('Safety instructions for equipment.', $chunk->content);
        self::assertSame(3, $chunk->pageNumber);
    }

    public function test_find_by_document_id_returns_chunks_in_index_order(): void
    {
        $repository = new PdoChunkRepository($this->executor);
        $repository->save(new Chunk(
            documentId: $this->documentId,
            sourceId: $this->sourceId,
            content: 'Second segment',
            chunkIndex: 1,
        ));
        $repository->save(new Chunk(
            documentId: $this->documentId,
            sourceId: $this->sourceId,
            content: 'First segment',
            chunkIndex: 0,
        ));

        $chunks = $repository->findByDocumentId($this->documentId);

        self::assertCount(2, $chunks);
        self::assertSame('First segment', $chunks[0]->content);
        self::assertSame('Second segment', $chunks[1]->content);
    }
}
