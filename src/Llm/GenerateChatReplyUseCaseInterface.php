<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

interface GenerateChatReplyUseCaseInterface
{
    public function execute(GenerateChatReplyInput $input): GenerateChatReplyOutput;
}
