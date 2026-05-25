<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class IngestionRouteRegistrar
{
    public function __construct(
        private PreviewCsvIngestionHandler $previewCsvHandler,
        private PreviewPdfIngestionHandler $previewPdfHandler,
        private CreateSourceHandler $createSourceHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $previewCsv = $this->previewCsvHandler;
        $previewPdf = $this->previewPdfHandler;
        $createSource = $this->createSourceHandler;

        $router->post(
            '/admin/ingestion/csv/preview',
            static fn (ServerRequestInterface $request) => $previewCsv->handle($request),
        );
        $router->post(
            '/admin/ingestion/pdf/preview',
            static fn (ServerRequestInterface $request) => $previewPdf->handle($request),
        );
        $router->post(
            '/admin/sources',
            static fn (ServerRequestInterface $request) => $createSource->handle($request),
        );
    }
}
