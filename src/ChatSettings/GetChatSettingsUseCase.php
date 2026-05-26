<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

final readonly class GetChatSettingsUseCase implements GetChatSettingsUseCaseInterface
{
    public function __construct(
        private ChatSettingsRepositoryInterface $repository,
    ) {
    }

    public function execute(): ChatSettingsView
    {
        return ChatSettingsView::fromSettings($this->repository->get());
    }
}
