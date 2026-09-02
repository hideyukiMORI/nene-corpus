<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

final readonly class RecallHttpResponse
{
    public function __construct(
        public int $statusCode,
        public string $body,
    ) {
    }

    public function isSuccessful(): bool
    {
        return $this->statusCode >= 200 && $this->statusCode < 300;
    }
}
