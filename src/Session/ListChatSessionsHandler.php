<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ListChatSessionsHandler
{
    public function __construct(
        private ListChatSessionsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $query = $request->getQueryParams();
        $limit = isset($query['limit']) ? (int) $query['limit'] : 50;
        $offset = isset($query['offset']) ? (int) $query['offset'] : 0;

        $summaries = $this->useCase->execute(new ListChatSessionsInput(limit: $limit, offset: $offset));

        return $this->response->create([
            'sessions' => array_map(
                static fn (ChatSessionSummary $summary): array => [
                    'session_id' => $summary->session->id,
                    'message_count' => $summary->messageCount,
                    'created_at' => $summary->session->createdAt,
                    'updated_at' => $summary->session->updatedAt,
                    'last_message_at' => $summary->lastMessageAt,
                    'client_ip' => $summary->session->clientIp,
                    'user_agent' => $summary->session->userAgent,
                    'referer' => $summary->session->referer,
                ],
                $summaries,
            ),
        ]);
    }
}
