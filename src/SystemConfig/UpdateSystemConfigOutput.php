<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

final readonly class UpdateSystemConfigOutput
{
    public function __construct(
        public SystemConfig $config,
    ) {
    }
}
