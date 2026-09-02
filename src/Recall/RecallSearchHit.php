<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

/**
 * One row of a Recall search response.
 *
 * `$externalId` is the Corpus `chunks.id` that was sent when the chunk was
 * indexed. It is nullable because Recall can also be used standalone, and rows
 * that were put there by something other than Corpus have no Corpus id —
 * those are dropped by the search repository (ADR 0007 Decision 2).
 */
final readonly class RecallSearchHit
{
    public function __construct(
        public int $chunkId,
        public ?int $externalId,
        public float $score,
        public ?float $vectorScore = null,
        public ?float $lexicalScore = null,
    ) {
    }
}
