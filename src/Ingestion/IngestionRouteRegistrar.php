<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class IngestionRouteRegistrar
{
    public function __construct(
        private PreviewCsvIngestionHandler $previewHandler,
        private CreateCsvSourceHandler $createSourceHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $preview = $this->previewHandler;
        $createSource = $this->createSourceHandler;

        $router->post(
            '/admin/ingestion/csv/preview',
            static fn (ServerRequestInterface $request) => $preview->handle($request),
        );
        $router->post(
            '/admin/sources',
            static fn (ServerRequestInterface $request) => $createSource->handle($request),
        );
    }
}
