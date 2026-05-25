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
use NeneCorpus\Chunk\ChunkServiceProvider;
use NeneCorpus\Document\DocumentServiceProvider;
use NeneCorpus\Ingestion\CsvIngestionExceptionHandler;
use NeneCorpus\Ingestion\IngestionRouteRegistrar;
use NeneCorpus\Ingestion\IngestionServiceProvider;
use NeneCorpus\Message\MessageServiceProvider;
use NeneCorpus\Search\SearchServiceProvider;
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
            ->addProvider(new AdminAuthServiceProvider())
            ->addProvider(new IngestionServiceProvider())
            ->set(
                self::ROUTE_REGISTRARS,
                static function (ContainerInterface $container): array {
                    $adminAuth = $container->get(AdminAuthServiceProvider::ROUTE_REGISTRAR);
                    $ingestion = $container->get(IngestionServiceProvider::ROUTE_REGISTRAR);
                    $source = $container->get(SourceServiceProvider::ROUTE_REGISTRAR);

                    if (!$adminAuth instanceof AdminAuthRouteRegistrar) {
                        throw new LogicException('Admin auth route registrar service is invalid.');
                    }

                    if (!$ingestion instanceof IngestionRouteRegistrar) {
                        throw new LogicException('Ingestion route registrar service is invalid.');
                    }

                    if (!$source instanceof SourceRouteRegistrar) {
                        throw new LogicException('Source route registrar service is invalid.');
                    }

                    return [$adminAuth, $ingestion, $source];
                },
            )
            ->set(
                self::EXCEPTION_HANDLERS,
                static function (ContainerInterface $container): array {
                    $invalidCredentials = $container->get(InvalidAdminCredentialsExceptionHandler::class);
                    $csvIngestion = $container->get(CsvIngestionExceptionHandler::class);
                    $sourceNotFound = $container->get(SourceNotFoundExceptionHandler::class);

                    if (!$invalidCredentials instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Invalid admin credentials exception handler service is invalid.');
                    }

                    if (!$csvIngestion instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('CSV ingestion exception handler service is invalid.');
                    }

                    if (!$sourceNotFound instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Source not found exception handler service is invalid.');
                    }

                    return [$invalidCredentials, $csvIngestion, $sourceNotFound];
                },
            );
    }
}
