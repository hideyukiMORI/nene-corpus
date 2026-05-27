<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AnalyticsRouteRegistrar
{
    public function __construct(
        private GetAnalyticsSummaryHandler $summaryHandler,
        private GetTopQuestionsHandler $topQuestionsHandler,
        private ExportConversationsHandler $exportHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $summary      = $this->summaryHandler;
        $topQuestions = $this->topQuestionsHandler;
        $export       = $this->exportHandler;

        $router->get(
            '/admin/analytics/summary',
            static fn (ServerRequestInterface $request) => $summary->handle($request),
        );

        $router->get(
            '/admin/analytics/top-questions',
            static fn (ServerRequestInterface $request) => $topQuestions->handle($request),
        );

        $router->get(
            '/admin/analytics/export',
            static fn (ServerRequestInterface $request) => $export->handle($request),
        );
    }
}
