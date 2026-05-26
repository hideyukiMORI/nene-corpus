<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

interface TestLlmConnectionUseCaseInterface
{
    public function execute(TestLlmConnectionInput $input): void;
}
