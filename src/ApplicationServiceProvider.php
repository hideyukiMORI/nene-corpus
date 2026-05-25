<?php

declare(strict_types=1);

namespace NeneCorpus;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\DomainExceptionHandlerInterface;
use NeneCorpus\AdminAuth\AdminAuthRouteRegistrar;
use NeneCorpus\AdminAuth\AdminAuthServiceProvider;
use NeneCorpus\AdminAuth\InvalidAdminCredentialsExceptionHandler;
use NeneCorpus\Appearance\AppearanceRouteRegistrar;
use NeneCorpus\Appearance\AppearanceServiceProvider;
use NeneCorpus\Chat\ChatRouteRegistrar;
use NeneCorpus\Chat\ChatServiceProvider;
use NeneCorpus\Chat\ChatSessionNotFoundExceptionHandler;
use NeneCorpus\Chunk\ChunkServiceProvider;
use NeneCorpus\Document\DocumentServiceProvider;
use NeneCorpus\Ingestion\CsvIngestionExceptionHandler;
use NeneCorpus\Ingestion\IngestionRouteRegistrar;
use NeneCorpus\Ingestion\IngestionServiceProvider;
use NeneCorpus\Llm\LlmServiceProvider;
use NeneCorpus\Message\MessageServiceProvider;
use NeneCorpus\RateLimit\RateLimitServiceProvider;
use NeneCorpus\Search\SearchServiceProvider;
use NeneCorpus\Session\AdminChatRouteRegistrar;
use NeneCorpus\Session\SessionServiceProvider;
use NeneCorpus\Source\SourceNotFoundExceptionHandler;
use NeneCorpus\Source\SourceRouteRegistrar;
use NeneCorpus\Source\SourceServiceProvider;
use Psr\Container\ContainerInterface;

final readonly class ApplicationServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRARS = 'nene-corpus.route_registrars';

    public const EXCEPTION_HANDLERS = 'nene-corpus.exception_handlers';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->addProvider(new SourceServiceProvider())
            ->addProvider(new DocumentServiceProvider())
            ->addProvider(new ChunkServiceProvider())
            ->addProvider(new SessionServiceProvider())
            ->addProvider(new MessageServiceProvider())
            ->addProvider(new SearchServiceProvider())
            ->addProvider(new LlmServiceProvider())
            ->addProvider(new ChatServiceProvider())
            ->addProvider(new RateLimitServiceProvider())
            ->addProvider(new AdminAuthServiceProvider())
            ->addProvider(new IngestionServiceProvider())
            ->addProvider(new AppearanceServiceProvider())
            ->set(
                self::ROUTE_REGISTRARS,
                static function (ContainerInterface $container): array {
                    $adminAuth = $container->get(AdminAuthServiceProvider::ROUTE_REGISTRAR);
                    $chat = $container->get(ChatServiceProvider::ROUTE_REGISTRAR);
                    $ingestion = $container->get(IngestionServiceProvider::ROUTE_REGISTRAR);
                    $source = $container->get(SourceServiceProvider::ROUTE_REGISTRAR);
                    $adminChat = $container->get(SessionServiceProvider::ROUTE_REGISTRAR);
                    $appearance = $container->get(AppearanceServiceProvider::ROUTE_REGISTRAR);

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

                    if (!$adminChat instanceof AdminChatRouteRegistrar) {
                        throw new LogicException('Admin chat route registrar service is invalid.');
                    }

                    if (!$appearance instanceof AppearanceRouteRegistrar) {
                        throw new LogicException('Appearance route registrar service is invalid.');
                    }

                    return [$adminAuth, $chat, $ingestion, $source, $adminChat, $appearance];
                },
            )
            ->set(
                self::EXCEPTION_HANDLERS,
                static function (ContainerInterface $container): array {
                    $invalidCredentials = $container->get(InvalidAdminCredentialsExceptionHandler::class);
                    $chatSessionNotFound = $container->get(ChatSessionNotFoundExceptionHandler::class);
                    $csvIngestion = $container->get(CsvIngestionExceptionHandler::class);
                    $sourceNotFound = $container->get(SourceNotFoundExceptionHandler::class);

                    if (!$invalidCredentials instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Invalid admin credentials exception handler service is invalid.');
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

                    return [$invalidCredentials, $chatSessionNotFound, $csvIngestion, $sourceNotFound];
                },
            );
    }
}
