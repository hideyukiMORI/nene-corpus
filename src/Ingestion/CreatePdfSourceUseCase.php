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

final readonly class CreatePdfSourceUseCase implements CreatePdfSourceUseCaseInterface
{
    public function __construct(
        private SourceRepositoryInterface $sources,
        private DocumentRepositoryInterface $documents,
        private ChunkRepositoryInterface $chunks,
        private PdfUploadValidator $validator,
        private PdfTextExtractor $extractor,
        private UploadStorage $uploadStorage,
    ) {
    }

    public function execute(CreatePdfSourceInput $input): CreateSourceOutput
    {
        $file = $this->validator->decode($input->content, $input->filename);
        $pages = $this->extractor->extractPages($file->bytes);
        $storagePath = $this->uploadStorage->store($file);

        $sourceId = $this->sources->save(new Source(
            name: $input->name,
            sourceType: SourceType::Pdf,
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
                metadataJson: json_encode(['page_count' => count($pages)], JSON_THROW_ON_ERROR),
            ));

            foreach ($pages as $index => $page) {
                $content = $page['text'];
                $this->chunks->save(new Chunk(
                    documentId: $documentId,
                    sourceId: $sourceId,
                    content: $content,
                    chunkIndex: $index,
                    pageNumber: $page['page_number'],
                    tokenCount: $this->estimateTokenCount($content),
                ));
            }

            $this->sources->update(new Source(
                name: $input->name,
                sourceType: SourceType::Pdf,
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
                sourceType: SourceType::Pdf,
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
            chunkCount: count($pages),
        );
    }

    private function estimateTokenCount(string $content): int
    {
        return (int) ceil(mb_strlen($content) / 4);
    }
}
