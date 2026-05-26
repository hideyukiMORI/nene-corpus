<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneCorpus\ChatLimits\ChatLimitsRepositoryInterface;
use NeneCorpus\ChatLimits\ChatTokenTrackerInterface;
use NeneCorpus\Http\RequestMetadataExtractor;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class SendChatMessageHandler
{
    public const SESSION_TOKEN_HEADER = 'X-Session-Token';

    public function __construct(
        private SendChatMessageUseCaseInterface $useCase,
        private JsonResponseFactory $response,
        private ChatLimitsRepositoryInterface $limitsRepository,
        private ChatTokenTrackerInterface $tokenTracker,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $sessionToken = trim($request->getHeaderLine(self::SESSION_TOKEN_HEADER));
        $body = JsonRequestBodyParser::parse($request);
        $content = trim((string) ($body['content'] ?? ''));

        $errors = [];

        if ($sessionToken === '') {
            $errors[] = new ValidationError(
                self::SESSION_TOKEN_HEADER,
                'Session token header is required.',
                'required',
            );
        }

        if ($content === '') {
            $errors[] = new ValidationError('content', 'Message content is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        // Character limit check (after empty-content guard so the error message is meaningful)
        $limits = $this->limitsRepository->get();

        if ($limits->maxMessageChars > 0 && mb_strlen($content) > $limits->maxMessageChars) {
            throw new ValidationException([
                new ValidationError(
                    'content',
                    sprintf('Message must not exceed %d characters.', $limits->maxMessageChars),
                    'too_long',
                ),
            ]);
        }

        $output = $this->useCase->execute(new SendChatMessageInput(
            sessionToken: $sessionToken,
            content: $content,
        ));

        // Track token usage for daily budget enforcement
        if ($output->inputTokens > 0 || $output->outputTokens > 0) {
            $ip = RequestMetadataExtractor::clientIp($request) ?? 'unknown';
            $this->tokenTracker->track($ip, $output->inputTokens, $output->outputTokens);
        }

        return $this->response->create([
            'message_id' => $output->messageId,
            'session_id' => $output->sessionId,
            'role' => $output->role,
            'content' => $output->content,
            'citations' => array_map(
                static fn ($citation) => $citation->toArray(),
                $output->citations,
            ),
        ]);
    }
}
