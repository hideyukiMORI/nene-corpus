<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class SendChatMessageHandler
{
    public const SESSION_TOKEN_HEADER = 'X-Session-Token';

    public function __construct(
        private SendChatMessageUseCaseInterface $useCase,
        private JsonResponseFactory $response,
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

        $output = $this->useCase->execute(new SendChatMessageInput(
            sessionToken: $sessionToken,
            content: $content,
        ));

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
