<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

interface CreateChatSessionUseCaseInterface
{
    public function execute(): CreateChatSessionOutput;
}
