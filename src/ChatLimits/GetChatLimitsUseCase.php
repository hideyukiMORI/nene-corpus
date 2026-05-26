<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

final readonly class GetChatLimitsUseCase implements GetChatLimitsUseCaseInterface
{
    public function __construct(
        private ChatLimitsRepositoryInterface $repository,
    ) {
    }

    public function execute(): ChatLimitsView
    {
        return ChatLimitsView::fromSettings($this->repository->get());
    }
}
