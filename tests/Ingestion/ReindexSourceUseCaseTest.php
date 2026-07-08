<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Ingestion;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Ingestion\CsvParser;
use NeneCorpus\Ingestion\PdfTextExtractor;
use NeneCorpus\Ingestion\ReindexSourceInput;
use NeneCorpus\Ingestion\ReindexSourceUseCase;
use NeneCorpus\Ingestion\SourceCorpusCleaner;
use NeneCorpus\Ingestion\StoredFileReader;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\FixedClock;
use NeneCorpus\Tests\Support\SampleTextPdf;
use PHPUnit\Framework\TestCase;

final class ReindexSourceUseCaseTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private RequestScopedOrgIdHolder $orgIdHolder;

    private string $projectRoot;

    protected function setUp(): void
    {
        $this->projectRoot = sys_get_temp_dir() . '/nene-corpus-reindex-' . uniqid('', true);
        mkdir($this->projectRoot . '/storage/uploads', 0775, true);

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

    protected function tearDown(): void
    {
        $this->removeDirectory($this->projectRoot);
    }

    public function test_execute_rebuilds_pdf_chunks_from_stored_file(): void
    {
        $storedFilename = 'sample-text.pdf';
        $storagePath = 'storage/uploads/' . $storedFilename;
        file_put_contents($this->projectRoot . '/' . $storagePath, SampleTextPdf::bytes());

        $sources = new PdoSourceRepository($this->executor, $this->orgIdHolder, new FixedClock());
        $documents = new PdoDocumentRepository($this->executor, $this->orgIdHolder, new FixedClock());
        $chunks = new PdoChunkRepository($this->executor, $this->orgIdHolder, new FixedClock());

        $sourceId = $sources->save(new Source(
            name: 'Sample manual',
            sourceType: SourceType::Pdf,
            status: SourceStatus::Ready,
            storagePath: $storagePath,
            originalFilename: 'sample-text.pdf',
            mimeType: 'application/pdf',
        ));

        $documentId = $documents->save(new \NeneCorpus\Document\Document(
            sourceId: $sourceId,
            title: 'Old title',
        ));

        $chunks->save(new \NeneCorpus\Chunk\Chunk(
            documentId: $documentId,
            sourceId: $sourceId,
            content: 'stale content',
        ));

        $useCase = new ReindexSourceUseCase(
            $sources,
            $documents,
            $chunks,
            new CsvParser(),
            new PdfTextExtractor(),
            new StoredFileReader($this->projectRoot),
            new SourceCorpusCleaner($documents, $chunks, new FixedClock()),
        );

        $output = $useCase->execute(new ReindexSourceInput(sourceId: $sourceId));

        self::assertSame(SourceStatus::Ready, $output->status);
        self::assertSame(1, $output->documentCount);
        self::assertSame(1, $output->chunkCount);

        $activeDocuments = $documents->findBySourceId($sourceId, 10, 0);
        self::assertCount(1, $activeDocuments);
        self::assertSame('Sample manual', $activeDocuments[0]->title);

        $activeChunks = $chunks->findByDocumentId($activeDocuments[0]->id ?? 0);
        self::assertCount(1, $activeChunks);
        self::assertStringContainsString('Sample PDF', $activeChunks[0]->content);
    }

    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }

        foreach (scandir($directory) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $path = $directory . '/' . $entry;

            if (is_dir($path)) {
                $this->removeDirectory($path);
            } else {
                unlink($path);
            }
        }

        rmdir($directory);
    }
}
