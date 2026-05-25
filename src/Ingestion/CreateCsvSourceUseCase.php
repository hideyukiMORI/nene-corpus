<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Document\Document;
use NeneCorpus\Document\DocumentRepositoryInterface;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceRepositoryInterface;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;

final readonly class CreateCsvSourceUseCase implements CreateCsvSourceUseCaseInterface
{
    public function __construct(
        private SourceRepositoryInterface $sources,
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
        private CsvUploadValidator $validator,
        private CsvParser $parser,
        private UploadStorage $uploadStorage,
    ) {
    }

    public function execute(CreateCsvSourceInput $input): CreateCsvSourceOutput
    {
        $file = $this->validator->decode($input->content, $input->filename);
        $rows = $this->parser->parseRows($file->bytes, $input->columnMapping);
        $storagePath = $this->uploadStorage->store($file);

        $sourceId = $this->sources->save(new Source(
            name: $input->name,
            sourceType: SourceType::Csv,
            status: SourceStatus::Processing,
            storagePath: $storagePath,
            originalFilename: $file->originalFilename,
            mimeType: $file->mimeType,
            byteSize: $file->byteSize(),
        ));

        $documentCount = 0;
        $chunkCount = 0;

        try {
            foreach ($rows as $position => $row) {
                $documentId = $this->documents->save(new Document(
                    sourceId: $sourceId,
                    title: $row['title'],
                    position: $position,
                    metadataJson: json_encode($row['metadata'], JSON_THROW_ON_ERROR),
                ));

                ++$documentCount;

                $content = $row['content'];
                $this->chunks->save(new Chunk(
                    documentId: $documentId,
                    sourceId: $sourceId,
                    content: $content,
                    chunkIndex: 0,
                    tokenCount: $this->estimateTokenCount($content),
                ));

                ++$chunkCount;
            }

            $this->sources->update(new Source(
                name: $input->name,
                sourceType: SourceType::Csv,
                status: SourceStatus::Ready,
                storagePath: $storagePath,
                originalFilename: $file->originalFilename,
                mimeType: $file->mimeType,
                byteSize: $file->byteSize(),
                id: $sourceId,
            ));
        } catch (\Throwable $exception) {
            $this->sources->update(new Source(
                name: $input->name,
                sourceType: SourceType::Csv,
                status: SourceStatus::Failed,
                storagePath: $storagePath,
                originalFilename: $file->originalFilename,
                mimeType: $file->mimeType,
                byteSize: $file->byteSize(),
                errorMessage: $exception->getMessage(),
                id: $sourceId,
            ));

            throw $exception;
        }

        return new CreateCsvSourceOutput(
            sourceId: $sourceId,
            name: $input->name,
            status: SourceStatus::Ready,
            documentCount: $documentCount,
            chunkCount: $chunkCount,
        );
    }

    private function estimateTokenCount(string $content): int
    {
        return (int) ceil(mb_strlen($content) / 4);
    }
}
