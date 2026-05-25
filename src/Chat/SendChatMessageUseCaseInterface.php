<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

interface SendChatMessageUseCaseInterface
{
    public function execute(SendChatMessageInput $input): SendChatMessageOutput;
}
