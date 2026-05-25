<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

final readonly class CreateTextSourceInput
{
    public function __construct(
        public string $name,
        public string $text,
    ) {
    }
}
