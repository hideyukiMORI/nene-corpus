<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

final readonly class UpdateChatLimitsUseCase implements UpdateChatLimitsUseCaseInterface
{
    public function __construct(
        private ChatLimitsRepositoryInterface $repository,
    ) {
    }

    public function execute(UpdateChatLimitsInput $input): ChatLimitsView
    {
        $settings = new ChatLimitsSettings(
            maxMessageChars: $input->maxMessageChars,
            messageIntervalSeconds: $input->messageIntervalSeconds,
            sessionRequestsPerHour: $input->sessionRequestsPerHour,
            ipRequestsPerHour: $input->ipRequestsPerHour,
            dailyRequestsPerIp: $input->dailyRequestsPerIp,
            dailyRequestsGlobal: $input->dailyRequestsGlobal,
            dailyTokensPerIp: $input->dailyTokensPerIp,
            dailyTokensGlobal: $input->dailyTokensGlobal,
        );

        $this->repository->save($settings);

        return ChatLimitsView::fromSettings($settings);
    }

}
