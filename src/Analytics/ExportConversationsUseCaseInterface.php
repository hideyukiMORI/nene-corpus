<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

interface ExportConversationsUseCaseInterface
{
    public function execute(ExportConversationsInput $input): ExportConversationsOutput;
}
