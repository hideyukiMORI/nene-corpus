<?php

declare(strict_types=1);

namespace NeneCorpus;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\DomainExceptionHandlerInterface;
use NeneCorpus\AdminAuth\AdminAuthRouteRegistrar;
use NeneCorpus\AdminAuth\AdminAuthServiceProvider;
use NeneCorpus\AdminAuth\AdminJwtNotConfiguredExceptionHandler;
use NeneCorpus\AdminAuth\InvalidAdminCredentialsExceptionHandler;
use NeneCorpus\AdminAuth\InvalidPasswordResetTokenExceptionHandler;
use NeneCorpus\Analytics\AnalyticsRouteRegistrar;
use NeneCorpus\Analytics\AnalyticsServiceProvider;
use NeneCorpus\Appearance\AppearanceRouteRegistrar;
use NeneCorpus\Appearance\AppearanceServiceProvider;
use NeneCorpus\Bootstrap\BootstrapRouteRegistrar;
use NeneCorpus\Bootstrap\BootstrapServiceProvider;
use NeneCorpus\Chat\ChatRouteRegistrar;
use NeneCorpus\Chat\ChatServiceProvider;
use NeneCorpus\Chat\ChatSessionNotFoundExceptionHandler;
use NeneCorpus\ChatLimits\ChatLimitsRouteRegistrar;
use NeneCorpus\ChatLimits\ChatLimitsServiceProvider;
use NeneCorpus\ChatSettings\ChatSettingsRouteRegistrar;
use NeneCorpus\ChatSettings\ChatSettingsServiceProvider;
use NeneCorpus\Chunk\ChunkServiceProvider;
use NeneCorpus\Document\DocumentNotFoundExceptionHandler;
use NeneCorpus\Document\DocumentRouteRegistrar;
use NeneCorpus\Document\DocumentServiceProvider;
use NeneCorpus\Document\DocumentValidationExceptionHandler;
use NeneCorpus\Ingestion\CsvIngestionExceptionHandler;
use NeneCorpus\Ingestion\IngestionRouteRegistrar;
use NeneCorpus\Ingestion\IngestionServiceProvider;
use NeneCorpus\Install\InstallAlreadyCompletedExceptionHandler;
use NeneCorpus\Install\InstallRouteRegistrar;
use NeneCorpus\Install\InstallRuntimeExceptionHandler;
use NeneCorpus\Install\InstallServiceProvider;
use NeneCorpus\Llm\LlmServiceProvider;
use NeneCorpus\Message\MessageServiceProvider;
use NeneCorpus\Notification\NotificationRouteRegistrar;
use NeneCorpus\Notification\NotificationServiceProvider;
use NeneCorpus\Organization\OrganizationRouteRegistrar;
use NeneCorpus\Organization\OrganizationServiceProvider;
use NeneCorpus\RateLimit\RateLimitServiceProvider;
use NeneCorpus\Search\SearchServiceProvider;
use NeneCorpus\Session\AdminChatRouteRegistrar;
use NeneCorpus\Session\SessionServiceProvider;
use NeneCorpus\Settings\LlmSettingsRouteRegistrar;
use NeneCorpus\Settings\SettingsServiceProvider;
use NeneCorpus\Source\SourceNotFoundExceptionHandler;
use NeneCorpus\Source\SourceRouteRegistrar;
use NeneCorpus\Source\SourceServiceProvider;
use NeneCorpus\SystemConfig\SystemConfigRouteRegistrar;
use NeneCorpus\SystemConfig\SystemConfigServiceProvider;
use NeneCorpus\Tenancy\Context\TenancyServiceProvider;
use Psr\Container\ContainerInterface;

final readonly class ApplicationServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRARS = 'nene-corpus.route_registrars';

    public const EXCEPTION_HANDLERS = 'nene-corpus.exception_handlers';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->addProvider(new BootstrapServiceProvider())
            ->addProvider(new SourceServiceProvider())
            ->addProvider(new DocumentServiceProvider())
            ->addProvider(new ChunkServiceProvider())
            ->addProvider(new SessionServiceProvider())
            ->addProvider(new MessageServiceProvider())
            ->addProvider(new SearchServiceProvider())
            ->addProvider(new LlmServiceProvider())
            ->addProvider(new ChatServiceProvider())
            ->addProvider(new ChatLimitsServiceProvider())
            ->addProvider(new RateLimitServiceProvider())
            ->addProvider(new AdminAuthServiceProvider())
            ->addProvider(new IngestionServiceProvider())
            ->addProvider(new AppearanceServiceProvider())
            ->addProvider(new SettingsServiceProvider())
            ->addProvider(new ChatSettingsServiceProvider())
            ->addProvider(new NotificationServiceProvider())
            ->addProvider(new AnalyticsServiceProvider())
            ->addProvider(new InstallServiceProvider())
            ->addProvider(new OrganizationServiceProvider())
            ->addProvider(new SystemConfigServiceProvider())
            ->addProvider(new TenancyServiceProvider())
            ->set(
                self::ROUTE_REGISTRARS,
                static function (ContainerInterface $container): array {
                    $bootstrap = $container->get(BootstrapServiceProvider::ROUTE_REGISTRAR);
                    $adminAuth = $container->get(AdminAuthServiceProvider::ROUTE_REGISTRAR);
                    $chat = $container->get(ChatServiceProvider::ROUTE_REGISTRAR);
                    $ingestion = $container->get(IngestionServiceProvider::ROUTE_REGISTRAR);
                    $source = $container->get(SourceServiceProvider::ROUTE_REGISTRAR);
                    $document = $container->get(DocumentServiceProvider::ROUTE_REGISTRAR);
                    $adminChat = $container->get(SessionServiceProvider::ROUTE_REGISTRAR);
                    $appearance = $container->get(AppearanceServiceProvider::ROUTE_REGISTRAR);
                    $settings = $container->get(SettingsServiceProvider::ROUTE_REGISTRAR);
                    $chatSettings = $container->get(ChatSettingsServiceProvider::ROUTE_REGISTRAR);
                    $chatLimits = $container->get(ChatLimitsServiceProvider::ROUTE_REGISTRAR);
                    $notification = $container->get(NotificationServiceProvider::ROUTE_REGISTRAR);
                    $analytics = $container->get(AnalyticsServiceProvider::ROUTE_REGISTRAR);
                    $install = $container->get(InstallServiceProvider::ROUTE_REGISTRAR);
                    $organization = $container->get(OrganizationServiceProvider::ROUTE_REGISTRAR);
                    $systemConfig = $container->get(SystemConfigServiceProvider::ROUTE_REGISTRAR);

                    if (!$bootstrap instanceof BootstrapRouteRegistrar) {
                        throw new LogicException('Bootstrap route registrar service is invalid.');
                    }

                    if (!$adminAuth instanceof AdminAuthRouteRegistrar) {
                        throw new LogicException('Admin auth route registrar service is invalid.');
                    }

                    if (!$chat instanceof ChatRouteRegistrar) {
                        throw new LogicException('Chat route registrar service is invalid.');
                    }

                    if (!$ingestion instanceof IngestionRouteRegistrar) {
                        throw new LogicException('Ingestion route registrar service is invalid.');
                    }

                    if (!$source instanceof SourceRouteRegistrar) {
                        throw new LogicException('Source route registrar service is invalid.');
                    }

                    if (!$document instanceof DocumentRouteRegistrar) {
                        throw new LogicException('Document route registrar service is invalid.');
                    }

                    if (!$adminChat instanceof AdminChatRouteRegistrar) {
                        throw new LogicException('Admin chat route registrar service is invalid.');
                    }

                    if (!$appearance instanceof AppearanceRouteRegistrar) {
                        throw new LogicException('Appearance route registrar service is invalid.');
                    }

                    if (!$settings instanceof LlmSettingsRouteRegistrar) {
                        throw new LogicException('Settings route registrar service is invalid.');
                    }

                    if (!$chatSettings instanceof ChatSettingsRouteRegistrar) {
                        throw new LogicException('Chat settings route registrar service is invalid.');
                    }

                    if (!$chatLimits instanceof ChatLimitsRouteRegistrar) {
                        throw new LogicException('Chat limits route registrar service is invalid.');
                    }

                    if (!$notification instanceof NotificationRouteRegistrar) {
                        throw new LogicException('Notification route registrar service is invalid.');
                    }

                    if (!$analytics instanceof AnalyticsRouteRegistrar) {
                        throw new LogicException('Analytics route registrar service is invalid.');
                    }

                    if (!$install instanceof InstallRouteRegistrar) {
                        throw new LogicException('Install route registrar service is invalid.');
                    }

                    if (!$organization instanceof OrganizationRouteRegistrar) {
                        throw new LogicException('Organization route registrar service is invalid.');
                    }

                    if (!$systemConfig instanceof SystemConfigRouteRegistrar) {
                        throw new LogicException('System config route registrar service is invalid.');
                    }

                    return [$install, $bootstrap, $adminAuth, $chat, $ingestion, $source, $document, $adminChat, $appearance, $settings, $chatSettings, $chatLimits, $notification, $analytics, $organization, $systemConfig];
                },
            )
            ->set(
                self::EXCEPTION_HANDLERS,
                static function (ContainerInterface $container): array {
                    $invalidCredentials = $container->get(InvalidAdminCredentialsExceptionHandler::class);
                    $adminJwtNotConfigured = $container->get(AdminJwtNotConfiguredExceptionHandler::class);
                    $invalidPasswordResetToken = $container->get(InvalidPasswordResetTokenExceptionHandler::class);
                    $chatSessionNotFound = $container->get(ChatSessionNotFoundExceptionHandler::class);
                    $csvIngestion = $container->get(CsvIngestionExceptionHandler::class);
                    $sourceNotFound = $container->get(SourceNotFoundExceptionHandler::class);
                    $documentNotFound = $container->get(DocumentNotFoundExceptionHandler::class);
                    $documentValidation = $container->get(DocumentValidationExceptionHandler::class);
                    $installAlreadyCompleted = $container->get(InstallAlreadyCompletedExceptionHandler::class);
                    $installRuntime = $container->get(InstallRuntimeExceptionHandler::class);

                    if (!$invalidCredentials instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Invalid admin credentials exception handler service is invalid.');
                    }

                    if (!$adminJwtNotConfigured instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Admin JWT not configured exception handler service is invalid.');
                    }

                    if (!$invalidPasswordResetToken instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Invalid password reset token exception handler service is invalid.');
                    }

                    if (!$chatSessionNotFound instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Chat session not found exception handler service is invalid.');
                    }

                    if (!$csvIngestion instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('CSV ingestion exception handler service is invalid.');
                    }

                    if (!$sourceNotFound instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Source not found exception handler service is invalid.');
                    }

                    if (!$documentNotFound instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Document not found exception handler service is invalid.');
                    }

                    if (!$documentValidation instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Document validation exception handler service is invalid.');
                    }

                    if (!$installAlreadyCompleted instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Install already completed exception handler service is invalid.');
                    }

                    if (!$installRuntime instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Install runtime exception handler service is invalid.');
                    }

                    return [
                        $invalidCredentials,
                        $adminJwtNotConfigured,
                        $invalidPasswordResetToken,
                        $chatSessionNotFound,
                        $csvIngestion,
                        $sourceNotFound,
                        $documentNotFound,
                        $documentValidation,
                        $installAlreadyCompleted,
                        $installRuntime,
                    ];
                },
            );
    }
}
