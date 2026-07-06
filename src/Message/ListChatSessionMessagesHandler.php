<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

use Nene2\Http\JsonResponseFactory;
use Nene2\Http\PaginationQueryParser;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ListChatSessionMessagesHandler
{
    public function __construct(
        private ListChatSessionMessagesUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $sessionId = (int) ($parameters['id'] ?? 0);

        // Bound the page size structurally: an unbounded ?limit= is a DoS / limit-injection
        // vector. The parser keeps the historical default of 100, caps at the use case's own
        // MAX_LIMIT (200), and rejects out-of-range values with 422 (envelope unchanged here).
        $pagination = PaginationQueryParser::parse($request, defaultLimit: 100, maxLimit: 200);

        $messages = $this->useCase->execute(new ListChatSessionMessagesInput(
            sessionId: $sessionId,
            limit: $pagination->limit,
            offset: $pagination->offset,
        ));

        return $this->response->create([
            'session_id' => $sessionId,
            'messages' => array_map(
                fn (ChatMessage $message): array => [
                    'message_id' => $message->id,
                    'role' => $message->role->value,
                    'content' => $message->content,
                    'citations' => $this->decodeCitations($message->citationsJson),
                    'created_at' => $message->createdAt,
                ],
                $messages,
            ),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function decodeCitations(?string $citationsJson): array
    {
        if ($citationsJson === null || $citationsJson === '') {
            return [];
        }

        $decoded = json_decode($citationsJson, true);

        if (!is_array($decoded)) {
            return [];
        }

        $citations = [];

        foreach ($decoded as $item) {
            if (is_array($item)) {
                $citations[] = $item;
            }
        }

        return $citations;
    }
}
