<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

final readonly class UpdateSourceOutput
{
    public function __construct(
        public int $sourceId,
        public string $name,
        public ?string $note,
        public string $updatedAt,
    ) {
    }
}
