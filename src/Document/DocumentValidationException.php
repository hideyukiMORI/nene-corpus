<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use DomainException;

final class DocumentValidationException extends DomainException
{
    public function __construct(
        string $message,
        public readonly string $field,
    ) {
        parent::__construct($message);
    }
}
