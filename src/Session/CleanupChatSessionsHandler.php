<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class CleanupChatSessionsHandler
{
    private const DEFAULT_MAX_AGE_DAYS = 90;

    public function __construct(
        private CleanupChatSessionsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params     = $request->getQueryParams();
        $maxAgeDays = isset($params['max_age_days'])
            ? max(1, (int) $params['max_age_days'])
            : self::DEFAULT_MAX_AGE_DAYS;

        $deleted = $this->useCase->execute($maxAgeDays);

        return $this->response->create(['deleted_count' => $deleted], 200);
    }
}
