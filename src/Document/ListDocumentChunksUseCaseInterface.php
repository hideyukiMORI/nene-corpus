<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

interface ListDocumentChunksUseCaseInterface
{
    /** @return list<DocumentChunkPreview> */
    public function execute(int $documentId): array;
}
