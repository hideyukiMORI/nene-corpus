<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use RuntimeException;

final class DocumentNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Document with id {$id} was not found.");
    }
}
