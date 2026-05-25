<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use NeneCorpus\Ingestion\StoredFileWriter;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceRepositoryInterface;
use NeneCorpus\Source\SourceType;

final readonly class UpdateDocumentUseCase implements UpdateDocumentUseCaseInterface
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private SourceRepositoryInterface $sources,
        private DocumentChunkReplacer $chunkReplacer,
        private DocumentValidator $validator,
        private StoredFileWriter $storedFiles,
    ) {
    }

    public function execute(UpdateDocumentInput $input): DocumentDetail
    {
        $document = $this->documents->findById($input->documentId);

        if ($document === null || $document->id === null) {
            throw new DocumentNotFoundException($input->documentId);
        }

        $source = $this->sources->findById($document->sourceId);

        if ($source === null) {
            throw new DocumentNotFoundException($input->documentId);
        }

        $validated = $this->validator->validateUpdate($input->title, $input->content);

        $metadataJson = $document->metadataJson;

        if ($source->sourceType === SourceType::Text) {
            $metadataJson = json_encode(['char_count' => mb_strlen($validated->content)], JSON_THROW_ON_ERROR);
            $this->storedFiles->write((string) $source->storagePath, $validated->content);
        }

        $this->documents->update(new Document(
            sourceId: $document->sourceId,
            title: $validated->title,
            position: $document->position,
            metadataJson: $metadataJson,
            id: $document->id,
            createdAt: $document->createdAt,
            updatedAt: $document->updatedAt,
        ));

        $this->chunkReplacer->replace($document->id, $document->sourceId, $validated->content);

        if ($source->id !== null) {
            $this->sources->update(new Source(
                name: $source->name,
                sourceType: $source->sourceType,
                status: $source->status,
                storagePath: $source->storagePath,
                originalFilename: $source->originalFilename,
                mimeType: $source->mimeType,
                byteSize: $source->sourceType === SourceType::Text ? mb_strlen($validated->content) : $source->byteSize,
                errorMessage: $source->errorMessage,
                ingestionConfigJson: $source->ingestionConfigJson,
                id: $source->id,
                createdAt: $source->createdAt,
                updatedAt: $source->updatedAt,
            ));
        }

        $updated = $this->documents->findById($document->id);

        if ($updated === null) {
            throw new DocumentNotFoundException($document->id);
        }

        return new DocumentDetail(
            documentId: $document->id,
            sourceId: $document->sourceId,
            title: $validated->title,
            position: $document->position,
            chunkCount: 1,
            content: $validated->content,
            createdAt: (string) $updated->createdAt,
            updatedAt: (string) $updated->updatedAt,
        );
    }
}
