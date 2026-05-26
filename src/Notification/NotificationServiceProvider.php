<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\Config\EnvironmentVariableUpdater;
use NeneCorpus\Install\EnvFileWriter;
use NeneCorpus\Mail\MailerInterface;
use NeneCorpus\Mail\NullMailer;
use NeneCorpus\Mail\SmtpConfig;
use NeneCorpus\Mail\SmtpMailer;
use Psr\Container\ContainerInterface;

final readonly class NotificationServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.notification';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                MailerInterface::class,
                static function (): MailerInterface {
                    $smtp = SmtpConfig::fromEnvironment();

                    return $smtp !== null ? new SmtpMailer($smtp) : new NullMailer();
                },
            )
            ->set(
                DailyReportRepositoryInterface::class,
                static function (ContainerInterface $container): DailyReportRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoDailyReportRepository($query);
                },
            )
            ->set(
                GetNotificationSettingsUseCase::class,
                static fn (): GetNotificationSettingsUseCase => new GetNotificationSettingsUseCase(),
            )
            ->set(
                UpdateNotificationSettingsUseCase::class,
                static function (ContainerInterface $container): UpdateNotificationSettingsUseCase {
                    $envWriter = $container->get(EnvFileWriter::class);
                    $envUpdater = $container->get(EnvironmentVariableUpdater::class);
                    $getUseCase = $container->get(GetNotificationSettingsUseCase::class);

                    if (!$envWriter instanceof EnvFileWriter) {
                        throw new LogicException('EnvFileWriter service is invalid.');
                    }

                    if (!$envUpdater instanceof EnvironmentVariableUpdater) {
                        throw new LogicException('EnvironmentVariableUpdater service is invalid.');
                    }

                    if (!$getUseCase instanceof GetNotificationSettingsUseCase) {
                        throw new LogicException('GetNotificationSettingsUseCase service is invalid.');
                    }

                    return new UpdateNotificationSettingsUseCase($envWriter, $envUpdater, $getUseCase);
                },
            )
            ->set(
                SendTestMailUseCase::class,
                static function (ContainerInterface $container): SendTestMailUseCase {
                    $mailer = $container->get(MailerInterface::class);

                    if (!$mailer instanceof MailerInterface) {
                        throw new LogicException('Mailer service is invalid.');
                    }

                    return new SendTestMailUseCase($mailer);
                },
            )
            ->set(
                SendDailyReportUseCase::class,
                static function (ContainerInterface $container): SendDailyReportUseCase {
                    $mailer = $container->get(MailerInterface::class);
                    $repo   = $container->get(DailyReportRepositoryInterface::class);

                    if (!$mailer instanceof MailerInterface) {
                        throw new LogicException('Mailer service is invalid.');
                    }

                    if (!$repo instanceof DailyReportRepositoryInterface) {
                        throw new LogicException('DailyReportRepository service is invalid.');
                    }

                    return new SendDailyReportUseCase($mailer, $repo);
                },
            )
            ->set(
                RateLimitNotifier::class,
                static function (ContainerInterface $container): RateLimitNotifier {
                    $mailer  = $container->get(MailerInterface::class);
                    $storage = $container->get(RateLimitStorageInterface::class);

                    if (!$mailer instanceof MailerInterface) {
                        throw new LogicException('Mailer service is invalid.');
                    }

                    if (!$storage instanceof RateLimitStorageInterface) {
                        throw new LogicException('RateLimitStorage service is invalid.');
                    }

                    return new RateLimitNotifier($mailer, $storage);
                },
            )
            ->set(
                GetNotificationSettingsHandler::class,
                static function (ContainerInterface $container): GetNotificationSettingsHandler {
                    $useCase  = $container->get(GetNotificationSettingsUseCase::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetNotificationSettingsUseCase) {
                        throw new LogicException('GetNotificationSettingsUseCase service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetNotificationSettingsHandler($useCase, $response);
                },
            )
            ->set(
                UpdateNotificationSettingsHandler::class,
                static function (ContainerInterface $container): UpdateNotificationSettingsHandler {
                    $useCase  = $container->get(UpdateNotificationSettingsUseCase::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof UpdateNotificationSettingsUseCase) {
                        throw new LogicException('UpdateNotificationSettingsUseCase service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateNotificationSettingsHandler($useCase, $response);
                },
            )
            ->set(
                SendTestMailHandler::class,
                static function (ContainerInterface $container): SendTestMailHandler {
                    $useCase      = $container->get(SendTestMailUseCase::class);
                    $response     = $container->get(JsonResponseFactory::class);
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$useCase instanceof SendTestMailUseCase) {
                        throw new LogicException('SendTestMailUseCase service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new SendTestMailHandler($useCase, $response, $problemDetails);
                },
            )
            ->set(
                SendDailyReportHandler::class,
                static function (ContainerInterface $container): SendDailyReportHandler {
                    $useCase      = $container->get(SendDailyReportUseCase::class);
                    $response     = $container->get(JsonResponseFactory::class);
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$useCase instanceof SendDailyReportUseCase) {
                        throw new LogicException('SendDailyReportUseCase service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new SendDailyReportHandler($useCase, $response, $problemDetails);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): NotificationRouteRegistrar {
                    $get         = $container->get(GetNotificationSettingsHandler::class);
                    $update      = $container->get(UpdateNotificationSettingsHandler::class);
                    $testMail    = $container->get(SendTestMailHandler::class);
                    $dailyReport = $container->get(SendDailyReportHandler::class);

                    if (!$get instanceof GetNotificationSettingsHandler) {
                        throw new LogicException('GetNotificationSettingsHandler service is invalid.');
                    }

                    if (!$update instanceof UpdateNotificationSettingsHandler) {
                        throw new LogicException('UpdateNotificationSettingsHandler service is invalid.');
                    }

                    if (!$testMail instanceof SendTestMailHandler) {
                        throw new LogicException('SendTestMailHandler service is invalid.');
                    }

                    if (!$dailyReport instanceof SendDailyReportHandler) {
                        throw new LogicException('SendDailyReportHandler service is invalid.');
                    }

                    return new NotificationRouteRegistrar($get, $update, $testMail, $dailyReport);
                },
            );
    }
}
