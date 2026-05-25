<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use DomainException;

final class CsvIngestionException extends DomainException
{
    public function __construct(
        string $message,
        public readonly string $field,
    ) {
        parent::__construct($message);
    }
}
