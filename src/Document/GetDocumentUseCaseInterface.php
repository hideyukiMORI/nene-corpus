<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

interface GetDocumentUseCaseInterface
{
    public function execute(int $documentId): DocumentDetail;
}
