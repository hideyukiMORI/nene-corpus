<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

interface ListChatSessionMessagesUseCaseInterface
{
    /** @return list<ChatMessage> */
    public function execute(ListChatSessionMessagesInput $input): array;
}
