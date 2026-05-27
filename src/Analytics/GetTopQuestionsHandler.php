<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetTopQuestionsHandler
{
    public function __construct(
        private GetTopQuestionsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $query  = $request->getQueryParams();
        $limit  = isset($query['limit']) ? max(1, min(100, (int) $query['limit'])) : 20;
        $from   = isset($query['from']) && $query['from'] !== '' ? (string) $query['from'] : null;
        $to     = isset($query['to']) && $query['to'] !== '' ? (string) $query['to'] : null;

        $output = $this->useCase->execute(new GetTopQuestionsInput($limit, $from, $to));

        return $this->response->create([
            'questions' => array_map(
                static fn (TopQuestion $q): array => [
                    'content'       => $q->content,
                    'count'         => $q->count,
                    'last_asked_at' => $q->lastAskedAt,
                ],
                $output->questions,
            ),
        ]);
    }
}
