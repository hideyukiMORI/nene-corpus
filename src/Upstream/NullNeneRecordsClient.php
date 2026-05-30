<?php

declare(strict_types=1);

namespace NeneCorpus\Upstream;

/** Used when NENE_RECORDS_API_BASE_URL is not configured. */
final readonly class NullNeneRecordsClient implements NeneRecordsClientInterface
{
    public function searchEntities(string $query, int $limit = 5): array
    {
        return [];
    }

    public function getRecord(string $entityTypeSlug, string $entitySlug): ?NeneRecordsEntity
    {
        return null;
    }

    public function ping(): bool
    {
        return false;
    }
}
