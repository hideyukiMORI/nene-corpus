<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

final readonly class UpdateChatSettingsUseCase implements UpdateChatSettingsUseCaseInterface
{
    public function __construct(
        private ChatSettingsRepositoryInterface $repository,
        private ChatSettingsValidator $validator,
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

    /**
     * @param array<string, mixed> $body
     */
    public function executeFromBody(array $body): ChatSettingsView
    {
        return $this->execute($this->validator->validateUpdate($body));
    }
}
