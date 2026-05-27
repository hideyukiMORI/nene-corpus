<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class ExportConversationsInput
{
    public const FORMAT_SESSIONS       = 'sessions';
    public const FORMAT_CONVERSATIONS  = 'conversations';

    public function __construct(
        /** 'sessions' | 'conversations' */
        public string $format = self::FORMAT_SESSIONS,
        public ?string $from = null,
        public ?string $to = null,
    ) {
    }
}
