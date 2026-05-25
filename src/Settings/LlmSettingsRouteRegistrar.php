<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class LlmSettingsRouteRegistrar
{
    public function __construct(
        private GetLlmSettingsHandler $getHandler,
        private UpdateLlmSettingsHandler $updateHandler,
        private TestLlmConnectionHandler $testHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $get = $this->getHandler;
        $update = $this->updateHandler;
        $test = $this->testHandler;

        $router->get(
            '/admin/settings/llm',
            static fn (ServerRequestInterface $request) => $get->handle($request),
        );

        $router->put(
            '/admin/settings/llm',
            static fn (ServerRequestInterface $request) => $update->handle($request),
        );

        $router->post(
            '/admin/settings/llm/test',
            static fn (ServerRequestInterface $request) => $test->handle($request),
        );
    }
}
