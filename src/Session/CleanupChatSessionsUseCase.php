<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

final readonly class CleanupChatSessionsUseCase implements CleanupChatSessionsUseCaseInterface
{
    private const MIN_MAX_AGE_DAYS = 1;

    private const MAX_MAX_AGE_DAYS = 3650;

    public function __construct(
        private ChatSessionRepositoryInterface $sessions,
    ) {
    }

    public function execute(int $maxAgeDays): int
    {
        $maxAgeDays = max(self::MIN_MAX_AGE_DAYS, min(self::MAX_MAX_AGE_DAYS, $maxAgeDays));

        return $this->sessions->deleteOlderThan($maxAgeDays);
    }
}
