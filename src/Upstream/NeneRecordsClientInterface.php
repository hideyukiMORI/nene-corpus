<?php

declare(strict_types=1);

namespace NeneCorpus\Upstream;

interface NeneRecordsClientInterface
{
    /**
     * Full-text search across slug and text field values.
     * Uses GET /api/v1/entities?q={query}&status=published
     *
     * @return NeneRecordsEntity[]
     */
    public function searchEntities(string $query, int $limit = 5): array;

    /**
     * Fetch a single public record view.
     * Uses GET /api/v1/public/entity-types/{slug}/records/{entitySlug}
     */
    public function getRecord(string $entityTypeSlug, string $entitySlug): ?NeneRecordsEntity;

    /**
     * Connectivity check against GET /health.
     */
    public function ping(): bool;
}
