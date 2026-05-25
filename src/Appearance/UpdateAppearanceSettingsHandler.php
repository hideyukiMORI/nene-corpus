<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UpdateAppearanceSettingsHandler
{
    public function __construct(
        private UpdateAppearanceSettingsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $settings = $this->useCase->execute(new UpdateAppearanceSettingsInput($body));

        return $this->response->create($settings->toArray());
    }
}
