<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

final readonly class Source
{
    public function __construct(
        public string $name,
        public SourceType $sourceType,
        public SourceStatus $status,
        public string $storagePath,
        public ?string $originalFilename = null,
        public ?string $mimeType = null,
        public ?int $byteSize = null,
        public ?string $errorMessage = null,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
        public bool $isDeleted = false,
        public ?string $deletedAt = null,
    ) {
    }
}
