<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

interface UpdateChatLimitsUseCaseInterface
{
    public function execute(UpdateChatLimitsInput $input): ChatLimitsView;

    /**
     * @param array<string, mixed> $body
     */
    public function executeFromBody(array $body): ChatLimitsView;
}
