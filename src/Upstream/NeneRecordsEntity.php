<?php

declare(strict_types=1);

namespace NeneCorpus\Upstream;

final readonly class NeneRecordsEntity
{
    public function __construct(
        public int $id,
        public int $entityTypeId,
        public ?string $slug,
        public string $status,
        public ?string $metaTitle,
        public ?string $metaDescription,
        public ?string $publishedAt,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: (int) ($data['id'] ?? 0),
            entityTypeId: (int) ($data['entity_type_id'] ?? 0),
            slug: isset($data['slug']) && is_string($data['slug']) ? $data['slug'] : null,
            status: is_string($data['status'] ?? null) ? $data['status'] : 'draft',
            metaTitle: isset($data['meta_title']) && is_string($data['meta_title']) ? $data['meta_title'] : null,
            metaDescription: isset($data['meta_description']) && is_string($data['meta_description']) ? $data['meta_description'] : null,
            publishedAt: isset($data['published_at']) && is_string($data['published_at']) ? $data['published_at'] : null,
        );
    }

    /** Human-readable label for use in LLM context. */
    public function label(): string
    {
        return $this->metaTitle ?? $this->slug ?? "entity:{$this->id}";
    }
}
