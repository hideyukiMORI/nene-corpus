<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Ingestion;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Ingestion\CreateCsvSourceInput;
use NeneCorpus\Ingestion\CreateCsvSourceUseCase;
use NeneCorpus\Ingestion\CsvColumnMapping;
use NeneCorpus\Ingestion\CsvParser;
use NeneCorpus\Ingestion\CsvUploadValidator;
use NeneCorpus\Ingestion\UploadStorage;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use PHPUnit\Framework\TestCase;

final class CreateCsvSourceUseCaseTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

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

        $this->uploadDirectory = sys_get_temp_dir() . '/nene-corpus-uploads-' . uniqid('', true);
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

    public function test_execute_persists_source_documents_and_chunks(): void
    {
        $csv = <<<'CSV'
product_name,description,price
Widget A,Great widget,100
Widget B,Another widget,200
CSV;

        $useCase = new CreateCsvSourceUseCase(
            new PdoSourceRepository($this->executor),
            new PdoDocumentRepository($this->executor),
            new PdoChunkRepository($this->executor),
            new CsvUploadValidator(),
            new CsvParser(),
            new UploadStorage($this->uploadDirectory),
        );

        $output = $useCase->execute(new CreateCsvSourceInput(
            name: 'Product catalog',
            filename: 'catalog.csv',
            content: base64_encode($csv),
            columnMapping: new CsvColumnMapping(
                titleColumn: 'product_name',
                contentColumns: ['description'],
                metadataColumns: ['price'],
            ),
        ));

        self::assertSame(SourceStatus::Ready, $output->status);
        self::assertSame(2, $output->documentCount);
        self::assertSame(2, $output->chunkCount);

        $source = (new PdoSourceRepository($this->executor))->findById($output->sourceId);
        self::assertNotNull($source);
        self::assertSame('csv', $source->sourceType->value);
        self::assertSame('ready', $source->status->value);
        self::assertStringStartsWith('storage/uploads/', $source->storagePath);

        $documents = (new PdoDocumentRepository($this->executor))->findBySourceId($output->sourceId, 10, 0);
        self::assertCount(2, $documents);
        self::assertSame('Widget A', $documents[0]->title);
    }
}
