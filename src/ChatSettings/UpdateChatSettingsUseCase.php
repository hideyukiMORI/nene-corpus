<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

final readonly class UpdateChatSettingsUseCase implements UpdateChatSettingsUseCaseInterface
{
    public function __construct(
        private ChatSettingsRepositoryInterface $repository,
    ) {
    }

    public function execute(UpdateChatSettingsInput $input): ChatSettingsView
    {
        $settings = new ChatSettings(
            systemPrompt: $input->systemPrompt,
            fallbackMessage: $input->fallbackMessage,
        );

        $this->repository->save($settings);

        return ChatSettingsView::fromSettings($settings);
    }

}
