<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

interface ListChatSessionsUseCaseInterface
{
    public function execute(ListChatSessionsInput $input): ListChatSessionsOutput;
}
