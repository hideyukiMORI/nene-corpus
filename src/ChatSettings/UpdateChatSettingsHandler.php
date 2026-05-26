<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UpdateChatSettingsHandler
{
    public function __construct(
        private UpdateChatSettingsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
        private ChatSettingsValidator $validator,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $input = $this->validator->validateUpdate($body);

        return $this->response->create($this->useCase->execute($input)->toArray());
    }
}
