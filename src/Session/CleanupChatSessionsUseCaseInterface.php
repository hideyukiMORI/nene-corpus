<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

interface CleanupChatSessionsUseCaseInterface
{
    /**
     * Deletes chat sessions (and their messages via CASCADE) older than the given number of days.
     *
     * @param int $maxAgeDays Sessions created more than this many days ago will be deleted.
     * @return int Number of deleted sessions.
     */
    public function execute(int $maxAgeDays): int;
}
