<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

use Nene2\Http\JsonResponseFactory;
use Nene2\Http\PaginationQueryParser;
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
        // Bound the page size structurally: an unbounded ?limit= is a DoS / limit-injection
        // vector. The parser keeps the historical default of 50 and rejects out-of-range
        // values with 422 (response envelope is intentionally left unchanged here).
        $pagination = PaginationQueryParser::parse($request, defaultLimit: 50, maxLimit: 200);

        $output = $this->useCase->execute(new ListChatSessionsInput(
            limit: $pagination->limit,
            offset: $pagination->offset,
        ));

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
                $output->sessions,
            ),
            'total' => $output->total,
        ]);
    }
}
