<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

final readonly class ListDocumentsInput
{
    public function __construct(
        public int $sourceId,
        public int $limit = 100,
        public int $offset = 0,
        public string $query = '',
    ) {
    }
}
