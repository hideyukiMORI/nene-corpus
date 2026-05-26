<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class NotificationRouteRegistrar
{
    public function __construct(
        private GetNotificationSettingsHandler $getHandler,
        private UpdateNotificationSettingsHandler $updateHandler,
        private SendTestMailHandler $testMailHandler,
        private SendDailyReportHandler $dailyReportHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $get          = $this->getHandler;
        $update       = $this->updateHandler;
        $testMail     = $this->testMailHandler;
        $dailyReport  = $this->dailyReportHandler;

        $router->get(
            '/admin/notifications/settings',
            static fn (ServerRequestInterface $request) => $get->handle($request),
        );

        $router->put(
            '/admin/notifications/settings',
            static fn (ServerRequestInterface $request) => $update->handle($request),
        );

        $router->post(
            '/admin/notifications/test-mail',
            static fn (ServerRequestInterface $request) => $testMail->handle($request),
        );

        // Public cron endpoint — protected by secret token, not JWT
        $router->get(
            '/admin/notifications/daily-report',
            static fn (ServerRequestInterface $request) => $dailyReport->handle($request),
        );
    }
}
