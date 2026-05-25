<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use RuntimeException;

final class ChatSessionNotFoundException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Chat session was not found.');
    }
}
