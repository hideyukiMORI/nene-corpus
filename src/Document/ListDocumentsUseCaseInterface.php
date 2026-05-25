<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

/** @return list<DocumentSummary> */
interface ListDocumentsUseCaseInterface
{
    /** @return list<DocumentSummary> */
    public function execute(ListDocumentsInput $input): array;
}
