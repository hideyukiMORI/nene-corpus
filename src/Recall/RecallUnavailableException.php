<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

use RuntimeException;

/**
 * The Recall backend could not be reached, or answered something unusable.
 *
 * Search catches this and falls back to LIKE search (unless NENE_RECALL_STRICT=1);
 * ingestion deliberately does not catch it — a silently missing index is worse
 * than a failed admin operation (ADR 0007 Decision 3).
 *
 * 🔴 Never put the bearer token (or the whole config object) into the message:
 * these messages travel into logs and into API error responses.
 */
final class RecallUnavailableException extends RuntimeException
{
    public static function status(string $operation, int $statusCode): self
    {
        return new self(sprintf('NeNe Recall %s returned HTTP %d.', $operation, $statusCode));
    }

    public static function transport(string $operation, string $detail): self
    {
        return new self(sprintf('NeNe Recall %s failed: %s', $operation, $detail));
    }

    public static function malformedResponse(string $operation): self
    {
        return new self(sprintf('NeNe Recall %s returned a malformed JSON body.', $operation));
    }
}
