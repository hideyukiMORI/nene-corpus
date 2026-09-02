<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Chunk;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\IndexedChunkRepository;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Document\Document;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Recall\RecallUnavailableException;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\FakeRecallClient;
use NeneCorpus\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

final class IndexedChunkRepositoryTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private RequestScopedOrgIdHolder $orgIdHolder;

    private FakeRecallClient $recall;

    private IndexedChunkRepository $repository;

    private PdoChunkRepository $inner;

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

        $this->orgIdHolder = new RequestScopedOrgIdHolder();
        $this->orgIdHolder->setId(7);
        $this->recall = new FakeRecallClient();
        $this->inner = new PdoChunkRepository($this->executor, $this->orgIdHolder, new FixedClock());
        $this->repository = new IndexedChunkRepository($this->inner, $this->recall, $this->orgIdHolder);

        $this->sourceId = (new PdoSourceRepository($this->executor, $this->orgIdHolder, new FixedClock()))->save(new Source(
            name: 'Manual',
            sourceType: SourceType::Text,
            status: SourceStatus::Ready,
            storagePath: 'storage/uploads/manual.txt',
        ));

        $this->documentId = (new PdoDocumentRepository($this->executor, $this->orgIdHolder, new FixedClock()))->save(new Document(
            sourceId: $this->sourceId,
            title: 'Safety guide',
            position: 0,
        ));
    }

    private function chunk(int $index = 0): Chunk
    {
        return new Chunk(
            documentId: $this->documentId,
            sourceId: $this->sourceId,
            content: '安全手順の説明',
            chunkIndex: $index,
            pageNumber: 4,
            sectionLabel: '2.1',
        );
    }

    public function test_save_indexes_the_chunk_under_its_generated_id(): void
    {
        $id = $this->repository->save($this->chunk());

        self::assertCount(1, $this->recall->puts);
        self::assertSame(7, $this->recall->puts[0]['org_id']);

        $sent = $this->recall->puts[0]['chunks'][0];
        // The id Recall gets back is the one the database just generated —
        // annotating anything else would make the index unciteable.
        self::assertSame($id, $sent->externalId);
        self::assertSame('安全手順の説明', $sent->content);
        self::assertSame(4, $sent->pageNumber);
        self::assertSame('2.1', $sent->sectionLabel);
    }

    public function test_save_still_writes_to_the_database(): void
    {
        $id = $this->repository->save($this->chunk());

        $stored = $this->inner->findById($id);

        self::assertNotNull($stored);
        self::assertSame('安全手順の説明', $stored->content);
    }

    public function test_delete_by_document_is_propagated(): void
    {
        $id = $this->repository->save($this->chunk());

        $this->repository->deleteByDocumentId($this->documentId);

        self::assertSame([['org_id' => 7, 'document_id' => $this->documentId]], $this->recall->documentDeletes);
        self::assertNull($this->inner->findById($id));
    }

    public function test_delete_by_source_is_propagated(): void
    {
        $this->repository->save($this->chunk());

        $this->repository->deleteBySourceId($this->sourceId);

        self::assertSame([['org_id' => 7, 'source_id' => $this->sourceId]], $this->recall->sourceDeletes);
        self::assertSame([], $this->inner->findByDocumentId($this->documentId));
    }

    public function test_reads_are_delegated_unchanged(): void
    {
        $id = $this->repository->save($this->chunk());

        self::assertSame($id, $this->repository->findById($id)?->id);
        self::assertCount(1, $this->repository->findByDocumentId($this->documentId));
    }

    public function test_recall_failure_on_save_is_not_swallowed(): void
    {
        $this->recall->willFail('NeNe Recall putChunks returned HTTP 503.');

        // Ingestion must stop: a chunk that is stored but never indexed makes the
        // corpus answer as if the document had never been uploaded.
        $this->expectException(RecallUnavailableException::class);

        $this->repository->save($this->chunk());
    }

    public function test_recall_failure_on_delete_is_not_swallowed(): void
    {
        $this->repository->save($this->chunk());
        $this->recall->willFail('NeNe Recall deleteBySource returned HTTP 503.');

        $this->expectException(RecallUnavailableException::class);

        $this->repository->deleteBySourceId($this->sourceId);
    }
}
