<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

final readonly class Document
{
    public function __construct(
        public int $sourceId,
        public string $title,
        public int $position = 0,
        public ?string $metadataJson = null,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
        public bool $isDeleted = false,
        public ?string $deletedAt = null,
    ) {
    }
}
