<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

interface TestLlmConnectionUseCaseInterface
{
    /**
     * @param array<string, mixed> $body
     */
    public function executeFromBody(array $body): void;
}
