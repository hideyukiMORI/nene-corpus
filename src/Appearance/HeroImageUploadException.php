<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use DomainException;

final class HeroImageUploadException extends DomainException
{
    public function __construct(
        string $message,
        public readonly string $field = 'content',
    ) {
        parent::__construct($message);
    }
}
