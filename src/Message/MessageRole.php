<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

enum MessageRole: string
{
    case User = 'user';
    case Assistant = 'assistant';
}
