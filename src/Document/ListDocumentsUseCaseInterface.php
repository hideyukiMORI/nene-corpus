<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

interface ListDocumentsUseCaseInterface
{
    /**
     * @return array{documents: list<DocumentSummary>, total: int}
     */
    public function execute(ListDocumentsInput $input): array;
}
