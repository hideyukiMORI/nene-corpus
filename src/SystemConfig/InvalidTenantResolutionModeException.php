<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

use InvalidArgumentException;

final class InvalidTenantResolutionModeException extends InvalidArgumentException
{
    public function __construct(string $mode)
    {
        parent::__construct("Invalid tenant resolution mode: '{$mode}'. Valid modes are: single, subdomain, path.");
    }
}
