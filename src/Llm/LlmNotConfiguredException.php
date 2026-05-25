<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

use RuntimeException;

final class LlmNotConfiguredException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Anthropic API key is not configured.');
    }
}
