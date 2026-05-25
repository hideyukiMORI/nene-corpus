<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

interface DeleteDocumentUseCaseInterface
{
    public function execute(int $documentId): void;
}
