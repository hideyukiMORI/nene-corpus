<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Ingestion;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Testing\DatabaseTestKit;
use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Ingestion\CreatePdfSourceInput;
use NeneCorpus\Ingestion\CreatePdfSourceUseCase;
use NeneCorpus\Ingestion\PdfTextExtractor;
use NeneCorpus\Ingestion\PdfUploadValidator;
use NeneCorpus\Ingestion\UploadStorage;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\SampleTextPdf;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class CreatePdfSourceUseCaseTest extends TestCase
{
    private DatabaseTestKit $kit;

    private RequestScopedOrgIdHolder $orgIdHolder;

    private string $uploadDirectory;

    private string $dbPath;

    protected function setUp(): void
    {
        // `:memory:` cannot be used here: `transactional()` opens a *separate*
        // connection via the connection factory, which for `:memory:` would see
        // an empty database. A file-backed SQLite DB lets both the transactional
        // connection and this test's assertion connection see the same data.
        $this->dbPath = sys_get_temp_dir() . '/nene-corpus-pdf-tx-' . uniqid('', true) . '.sqlite';
        $this->kit = DatabaseTestKit::sqlite($this->dbPath);

        CorpusSchemaSetup::create($this->kit->queryExecutor);

        $this->orgIdHolder = new RequestScopedOrgIdHolder();
        $this->orgIdHolder->setId(1);

        $this->uploadDirectory = sys_get_temp_dir() . '/nene-corpus-pdf-uploads-' . uniqid('', true);
        mkdir($this->uploadDirectory, 0775, true);
    }

    protected function tearDown(): void
    {
        foreach (glob($this->uploadDirectory . '/*') ?: [] as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }

        if (is_dir($this->uploadDirectory)) {
            rmdir($this->uploadDirectory);
        }

        foreach ([$this->dbPath, $this->dbPath . '-journal', $this->dbPath . '-wal', $this->dbPath . '-shm'] as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
    }

    public function test_execute_persists_pdf_source_document_and_chunks(): void
    {
        $useCase = new CreatePdfSourceUseCase(
            $this->kit->transactionManager,
            fn (DatabaseQueryExecutorInterface $e) => new PdoSourceRepository($e, $this->orgIdHolder),
            fn (DatabaseQueryExecutorInterface $e) => new PdoDocumentRepository($e, $this->orgIdHolder),
            fn (DatabaseQueryExecutorInterface $e) => new PdoChunkRepository($e, $this->orgIdHolder),
            $this->kit->queryExecutor,
            new PdfUploadValidator(),
            new PdfTextExtractor(),
            new UploadStorage($this->uploadDirectory),
        );

        $output = $useCase->execute(new CreatePdfSourceInput(
            name: 'Sample manual',
            filename: 'sample-text.pdf',
            content: SampleTextPdf::base64(),
        ));

        self::assertSame(SourceStatus::Ready, $output->status);
        self::assertSame(1, $output->documentCount);
        self::assertSame(1, $output->chunkCount);

        $source = (new PdoSourceRepository($this->kit->queryExecutor, $this->orgIdHolder))->findById($output->sourceId);
        self::assertNotNull($source);
        self::assertSame('pdf', $source->sourceType->value);
        self::assertSame('ready', $source->status->value);

        $chunks = (new PdoChunkRepository($this->kit->queryExecutor, $this->orgIdHolder))->findByDocumentId(
            (new PdoDocumentRepository($this->kit->queryExecutor, $this->orgIdHolder))->findBySourceId($output->sourceId, 1, 0)[0]->id ?? 0,
        );
        self::assertCount(1, $chunks);
        self::assertSame(1, $chunks[0]->pageNumber);
        self::assertStringContainsString('Sample PDF', $chunks[0]->content);
    }

    public function test_execute_rolls_back_documents_and_chunks_when_a_write_fails_midway(): void
    {
        $failingChunks = new class () implements ChunkRepositoryInterface {
            public function findById(int $id): ?Chunk
            {
                return null;
            }

            public function findByDocumentId(int $documentId): array
            {
                return [];
            }

            public function save(Chunk $chunk): int
            {
                throw new RuntimeException('simulated chunk write failure');
            }

            public function deleteByDocumentId(int $documentId): void
            {
            }

            public function deleteBySourceId(int $sourceId): void
            {
            }
        };

        $useCase = new CreatePdfSourceUseCase(
            $this->kit->transactionManager,
            fn (DatabaseQueryExecutorInterface $e) => new PdoSourceRepository($e, $this->orgIdHolder),
            fn (DatabaseQueryExecutorInterface $e) => new PdoDocumentRepository($e, $this->orgIdHolder),
            fn (DatabaseQueryExecutorInterface $e) => $failingChunks,
            $this->kit->queryExecutor,
            new PdfUploadValidator(),
            new PdfTextExtractor(),
            new UploadStorage($this->uploadDirectory),
        );

        try {
            $useCase->execute(new CreatePdfSourceInput(
                name: 'Sample manual',
                filename: 'sample-text.pdf',
                content: SampleTextPdf::base64(),
            ));
            self::fail('Expected the simulated chunk write failure to propagate.');
        } catch (RuntimeException $exception) {
            self::assertSame('simulated chunk write failure', $exception->getMessage());
        }

        $documents = (new PdoDocumentRepository($this->kit->queryExecutor, $this->orgIdHolder))->findBySourceId(1, 100, 0);
        self::assertSame([], $documents, 'The transactional document insert must have been rolled back.');

        $sourceRepository = new PdoSourceRepository($this->kit->queryExecutor, $this->orgIdHolder);
        $failedSource = $sourceRepository->findById(1);
        self::assertNotNull($failedSource, 'A single compensating Failed source row should exist.');
        self::assertSame('failed', $failedSource->status->value);
        self::assertSame('simulated chunk write failure', $failedSource->errorMessage);

        // No second (rolled-back) source row should have leaked through either.
        self::assertNull($sourceRepository->findById(2));
    }
}
