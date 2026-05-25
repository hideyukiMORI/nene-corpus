<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Document\Document;
use NeneCorpus\Document\DocumentRepositoryInterface;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceNotFoundException;
use NeneCorpus\Source\SourceRepositoryInterface;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;

final readonly class ReindexSourceUseCase implements ReindexSourceUseCaseInterface
{
    public function __construct(
        private SourceRepositoryInterface $sources,
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
        private CsvParser $csvParser,
        private PdfTextExtractor $pdfExtractor,
        private StoredFileReader $storedFiles,
        private SourceCorpusCleaner $corpusCleaner,
    ) {
    }

    public function execute(ReindexSourceInput $input): CreateSourceOutput
    {
        $source = $this->sources->findById($input->sourceId);

        if ($source === null || $source->id === null) {
            throw new SourceNotFoundException($input->sourceId);
        }

        $bytes = $this->storedFiles->read($source->storagePath);

        $this->sources->update($this->processingSource($source));
        $this->corpusCleaner->clear($source->id);

        try {
            $result = match ($source->sourceType) {
                SourceType::Csv => $this->reindexCsv($source, $bytes, $input->columnMappingOverride),
                SourceType::Pdf => $this->reindexPdf($source, $bytes),
                SourceType::Text => $this->reindexText($source, $bytes),
            };

            $this->sources->update(new Source(
                name: $source->name,
                sourceType: $source->sourceType,
                status: SourceStatus::Ready,
                storagePath: $source->storagePath,
                originalFilename: $source->originalFilename,
                mimeType: $source->mimeType,
                byteSize: $source->byteSize,
                ingestionConfigJson: $source->ingestionConfigJson,
                id: $source->id,
            ));

            return new CreateSourceOutput(
                sourceId: $source->id,
                name: $source->name,
                status: SourceStatus::Ready,
                documentCount: $result['document_count'],
                chunkCount: $result['chunk_count'],
            );
        } catch (\Throwable $exception) {
            $this->sources->update(new Source(
                name: $source->name,
                sourceType: $source->sourceType,
                status: SourceStatus::Failed,
                storagePath: $source->storagePath,
                originalFilename: $source->originalFilename,
                mimeType: $source->mimeType,
                byteSize: $source->byteSize,
                errorMessage: $exception->getMessage(),
                ingestionConfigJson: $source->ingestionConfigJson,
                id: $source->id,
            ));

            throw $exception;
        }
    }

    /**
     * @return array{document_count: int, chunk_count: int}
     */
    private function reindexCsv(Source $source, string $bytes, ?CsvColumnMapping $override): array
    {
        if ($source->id === null) {
            throw new CsvIngestionException('Source id is missing.', 'source_id');
        }

        $mapping = $override ?? IngestionConfigJson::decodeCsvMapping($source->ingestionConfigJson);
        $rows = $this->csvParser->parseRows($bytes, $mapping);

        $documentCount = 0;
        $chunkCount = 0;

        foreach ($rows as $position => $row) {
            $documentId = $this->documents->save(new Document(
                sourceId: $source->id,
                title: $row['title'],
                position: $position,
                metadataJson: json_encode($row['metadata'], JSON_THROW_ON_ERROR),
            ));

            ++$documentCount;

            $content = $row['content'];
            $this->chunks->save(new Chunk(
                documentId: $documentId,
                sourceId: $source->id,
                content: $content,
                chunkIndex: 0,
                tokenCount: $this->estimateTokenCount($content),
            ));

            ++$chunkCount;
        }

        return [
            'document_count' => $documentCount,
            'chunk_count' => $chunkCount,
        ];
    }

    /**
     * @return array{document_count: int, chunk_count: int}
     */
    private function reindexPdf(Source $source, string $bytes): array
    {
        if ($source->id === null) {
            throw new CsvIngestionException('Source id is missing.', 'source_id');
        }

        $pages = $this->pdfExtractor->extractPages($bytes);

        $documentId = $this->documents->save(new Document(
            sourceId: $source->id,
            title: $source->name,
            position: 0,
            metadataJson: json_encode(['page_count' => count($pages)], JSON_THROW_ON_ERROR),
        ));

        foreach ($pages as $index => $page) {
            $content = $page['text'];
            $this->chunks->save(new Chunk(
                documentId: $documentId,
                sourceId: $source->id,
                content: $content,
                chunkIndex: $index,
                pageNumber: $page['page_number'],
                tokenCount: $this->estimateTokenCount($content),
            ));
        }

        return [
            'document_count' => 1,
            'chunk_count' => count($pages),
        ];
    }

    /**
     * @return array{document_count: int, chunk_count: int}
     */
    private function reindexText(Source $source, string $bytes): array
    {
        if ($source->id === null) {
            throw new CsvIngestionException('Source id is missing.', 'source_id');
        }

        $content = trim($bytes);

        if ($content === '') {
            throw new CsvIngestionException('Stored text content is empty.', 'text');
        }

        $documentId = $this->documents->save(new Document(
            sourceId: $source->id,
            title: $source->name,
            position: 0,
            metadataJson: json_encode(['char_count' => mb_strlen($content)], JSON_THROW_ON_ERROR),
        ));

        $this->chunks->save(new Chunk(
            documentId: $documentId,
            sourceId: $source->id,
            content: $content,
            chunkIndex: 0,
            tokenCount: $this->estimateTokenCount($content),
        ));

        return [
            'document_count' => 1,
            'chunk_count' => 1,
        ];
    }

    private function processingSource(Source $source): Source
    {
        return new Source(
            name: $source->name,
            sourceType: $source->sourceType,
            status: SourceStatus::Processing,
            storagePath: $source->storagePath,
            originalFilename: $source->originalFilename,
            mimeType: $source->mimeType,
            byteSize: $source->byteSize,
            ingestionConfigJson: $source->ingestionConfigJson,
            id: $source->id,
        );
    }

    private function estimateTokenCount(string $content): int
    {
        return (int) ceil(mb_strlen($content) / 4);
    }
}
