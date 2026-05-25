<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Document;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Document\Document;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use PHPUnit\Framework\TestCase;

final class PdoDocumentRepositoryTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private int $sourceId;

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
    }

    public function test_save_and_find_by_id_returns_document(): void
    {
        $repository = new PdoDocumentRepository($this->executor);
        $id = $repository->save(new Document(
            sourceId: $this->sourceId,
            title: 'Chapter 1',
            position: 1,
            metadataJson: '{"page_count":10}',
        ));

        $document = $repository->findById($id);

        self::assertNotNull($document);
        self::assertSame($this->sourceId, $document->sourceId);
        self::assertSame('Chapter 1', $document->title);
        self::assertSame('{"page_count":10}', $document->metadataJson);
    }

    public function test_find_by_source_id_returns_documents_in_position_order(): void
    {
        $repository = new PdoDocumentRepository($this->executor);
        $repository->save(new Document(sourceId: $this->sourceId, title: 'Second', position: 2));
        $repository->save(new Document(sourceId: $this->sourceId, title: 'First', position: 1));

        $documents = $repository->findBySourceId($this->sourceId, 10, 0);

        self::assertCount(2, $documents);
        self::assertSame('First', $documents[0]->title);
        self::assertSame('Second', $documents[1]->title);
    }

    public function test_soft_delete_excludes_document_from_find_by_id(): void
    {
        $repository = new PdoDocumentRepository($this->executor);
        $id = $repository->save(new Document(
            sourceId: $this->sourceId,
            title: 'Temporary',
            position: 0,
        ));

        $repository->softDelete($id, '2026-05-25 12:00:00');

        self::assertNull($repository->findById($id));
    }
}
