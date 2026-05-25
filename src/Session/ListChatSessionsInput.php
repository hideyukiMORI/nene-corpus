<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

final readonly class ListChatSessionsInput
{
    public function __construct(
        public int $limit,
        public int $offset,
    ) {
    }
}
