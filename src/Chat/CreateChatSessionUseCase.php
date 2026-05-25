<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use NeneCorpus\Session\ChatSession;
use NeneCorpus\Session\ChatSessionRepositoryInterface;

final readonly class CreateChatSessionUseCase implements CreateChatSessionUseCaseInterface
{
    public function __construct(
        private ChatSessionRepositoryInterface $sessions,
    ) {
    }

    public function execute(CreateChatSessionInput $input): CreateChatSessionOutput
    {
        $sessionId = $this->sessions->save(new ChatSession(
            publicToken: bin2hex(random_bytes(32)),
            clientIp: $input->clientIp,
            userAgent: $input->userAgent,
            referer: $input->referer,
        ));

        $session = $this->sessions->findById($sessionId);

        if ($session === null || $session->id === null) {
            throw new \RuntimeException('Failed to load chat session after creation.');
        }

        return new CreateChatSessionOutput(
            sessionId: $session->id,
            sessionToken: $session->publicToken,
        );
    }
}
