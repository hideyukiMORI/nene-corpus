<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Ingestion;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
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

final class CreatePdfSourceUseCaseTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private RequestScopedOrgIdHolder $orgIdHolder;

    private string $uploadDirectory;

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
    }

    public function test_execute_persists_pdf_source_document_and_chunks(): void
    {
        $useCase = new CreatePdfSourceUseCase(
            new PdoSourceRepository($this->executor, $this->orgIdHolder),
            new PdoDocumentRepository($this->executor, $this->orgIdHolder),
            new PdoChunkRepository($this->executor, $this->orgIdHolder),
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

        $source = (new PdoSourceRepository($this->executor, $this->orgIdHolder))->findById($output->sourceId);
        self::assertNotNull($source);
        self::assertSame('pdf', $source->sourceType->value);
        self::assertSame('ready', $source->status->value);

        $chunks = (new PdoChunkRepository($this->executor, $this->orgIdHolder))->findByDocumentId(
            (new PdoDocumentRepository($this->executor, $this->orgIdHolder))->findBySourceId($output->sourceId, 1, 0)[0]->id ?? 0,
        );
        self::assertCount(1, $chunks);
        self::assertSame(1, $chunks[0]->pageNumber);
        self::assertStringContainsString('Sample PDF', $chunks[0]->content);
    }
}
