<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

interface DeleteSourceUseCaseInterface
{
    public function execute(int $sourceId): void;
}
