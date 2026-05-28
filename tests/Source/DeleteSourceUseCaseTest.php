<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Source;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Source\DeleteSourceUseCase;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceNotFoundException;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use PHPUnit\Framework\TestCase;

final class DeleteSourceUseCaseTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private RequestScopedOrgIdHolder $orgIdHolder;

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

        $this->orgIdHolder = new RequestScopedOrgIdHolder();
        $this->orgIdHolder->setId(1);
    }

    public function test_execute_soft_deletes_source_and_removes_chunks(): void
    {
        $sources = new PdoSourceRepository($this->executor, $this->orgIdHolder);
        $documents = new PdoDocumentRepository($this->executor, $this->orgIdHolder);
        $chunks = new PdoChunkRepository($this->executor, $this->orgIdHolder);

        $sourceId = $sources->save(new Source(
            name: 'Manual',
            sourceType: SourceType::Pdf,
            status: SourceStatus::Ready,
            storagePath: 'storage/uploads/manual.pdf',
        ));

        $documentId = $documents->save(new \NeneCorpus\Document\Document(
            sourceId: $sourceId,
            title: 'Manual',
        ));

        $chunks->save(new \NeneCorpus\Chunk\Chunk(
            documentId: $documentId,
            sourceId: $sourceId,
            content: 'Sample text',
        ));

        (new DeleteSourceUseCase($sources, $documents, $chunks))->execute($sourceId);

        self::assertNull($sources->findById($sourceId));
        self::assertSame([], $chunks->findByDocumentId($documentId));
        self::assertSame([], $documents->findBySourceId($sourceId, 10, 0));
    }

    public function test_execute_throws_when_source_is_missing(): void
    {
        $this->expectException(SourceNotFoundException::class);

        (new DeleteSourceUseCase(
            new PdoSourceRepository($this->executor, $this->orgIdHolder),
            new PdoDocumentRepository($this->executor, $this->orgIdHolder),
            new PdoChunkRepository($this->executor, $this->orgIdHolder),
        ))->execute(999);
    }
}
