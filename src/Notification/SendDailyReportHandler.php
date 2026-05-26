<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use NeneCorpus\Mail\MailSendException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class SendDailyReportHandler
{
    public function __construct(
        private SendDailyReportUseCase $useCase,
        private JsonResponseFactory $response,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $config = NotificationConfig::fromEnvironment();

        // Token validation (public endpoint — no JWT required)
        $params = $request->getQueryParams();
        $token  = trim((string) ($params['token'] ?? ''));

        if ($config->dailyReportToken === '' || $token !== $config->dailyReportToken) {
            return $this->problemDetails->create($request, 'unauthorized', 'Unauthorized', 401, 'Invalid or missing token.');
        }

        if (!$config->dailyReportEnabled) {
            return $this->problemDetails->create($request, 'not-enabled', 'Daily Report Disabled', 422, 'Daily report is not enabled.');
        }

        $notifyEmail = $config->notifyEmail !== '' ? $config->notifyEmail : null;

        if ($notifyEmail === null) {
            return $this->problemDetails->create($request, 'no-recipient', 'No Recipient', 422, 'Notification email address is not configured.');
        }

        $date = trim((string) ($params['date'] ?? ''));

        if ($date === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $date = null;
        }

        try {
            $stats = $this->useCase->execute($notifyEmail, $date);
        } catch (NotificationException $e) {
            return $this->problemDetails->create($request, 'smtp-not-configured', 'SMTP Not Configured', 422, $e->getMessage());
        } catch (MailSendException $e) {
            return $this->problemDetails->create($request, 'mail-send-failed', 'Mail Send Failed', 502, $e->getMessage());
        }

        return $this->response->create([
            'success'        => true,
            'report_date'    => $stats->reportDate,
            'total_sessions' => $stats->totalSessions,
            'total_messages' => $stats->totalMessages,
            'unique_ips'     => $stats->uniqueIps,
            'rate_limit_hits' => $stats->rateLimitHits,
        ]);
    }
}
