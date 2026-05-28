<?php

declare(strict_types=1);

namespace NeneCorpus\Bootstrap;

interface GetBootstrapInfoUseCaseInterface
{
    public function execute(): BootstrapInfo;
}
