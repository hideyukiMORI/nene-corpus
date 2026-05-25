<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use RuntimeException;

final class SourceNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Source with id {$id} was not found.");
    }
}
