<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class GetNotificationSettingsHandler
{
    public function __construct(
        private GetNotificationSettingsUseCase $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $view = $this->useCase->execute();

        return $this->response->create($view->toArray());
    }
}
