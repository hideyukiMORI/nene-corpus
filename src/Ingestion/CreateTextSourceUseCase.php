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

final readonly class CreateTextSourceUseCase implements CreateTextSourceUseCaseInterface
{
    public function __construct(
        private SourceRepositoryInterface $sources,
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
        private TextContentValidator $validator,
        private UploadStorage $uploadStorage,
    ) {
    }

    public function execute(CreateTextSourceInput $input): CreateSourceOutput
    {
        $file = $this->validator->toStoredFile($input->name, $input->text);
        $storagePath = $this->uploadStorage->store($file);

        $sourceId = $this->sources->save(new Source(
            name: $input->name,
            sourceType: SourceType::Text,
            status: SourceStatus::Processing,
            storagePath: $storagePath,
            originalFilename: $file->originalFilename,
            mimeType: $file->mimeType,
            byteSize: $file->byteSize(),
        ));

        try {
            $documentId = $this->documents->save(new Document(
                sourceId: $sourceId,
                title: $input->name,
                position: 0,
                metadataJson: json_encode(['char_count' => mb_strlen($file->bytes)], JSON_THROW_ON_ERROR),
            ));

            $this->chunks->save(new Chunk(
                documentId: $documentId,
                sourceId: $sourceId,
                content: $file->bytes,
                chunkIndex: 0,
                tokenCount: $this->estimateTokenCount($file->bytes),
            ));

            $this->sources->update(new Source(
                name: $input->name,
                sourceType: SourceType::Text,
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
                sourceType: SourceType::Text,
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

        return new CreateSourceOutput(
            sourceId: $sourceId,
            name: $input->name,
            status: SourceStatus::Ready,
            documentCount: 1,
            chunkCount: 1,
        );
    }

    private function estimateTokenCount(string $content): int
    {
        return (int) ceil(mb_strlen($content) / 4);
    }
}
