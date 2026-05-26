<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

interface GetChatLimitsUseCaseInterface
{
    public function execute(): ChatLimitsView;
}
