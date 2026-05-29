<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

interface UpdateSourceUseCaseInterface
{
    public function execute(UpdateSourceInput $input): UpdateSourceOutput;
}
