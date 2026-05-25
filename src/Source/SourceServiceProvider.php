<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Document\DocumentRepositoryInterface;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseFactoryInterface;

final readonly class SourceServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.source';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                SourceRepositoryInterface::class,
                static function (ContainerInterface $container): SourceRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoSourceRepository($query);
                },
            )
            ->set(
                DeleteSourceUseCaseInterface::class,
                static function (ContainerInterface $container): DeleteSourceUseCaseInterface {
                    $sources = $container->get(SourceRepositoryInterface::class);
                    $documents = $container->get(DocumentRepositoryInterface::class);
                    $chunks = $container->get(ChunkRepositoryInterface::class);

                    if (!$sources instanceof SourceRepositoryInterface) {
                        throw new LogicException('Source repository service is invalid.');
                    }

                    if (!$documents instanceof DocumentRepositoryInterface) {
                        throw new LogicException('Document repository service is invalid.');
                    }

                    if (!$chunks instanceof ChunkRepositoryInterface) {
                        throw new LogicException('Chunk repository service is invalid.');
                    }

                    return new DeleteSourceUseCase($sources, $documents, $chunks);
                },
            )
            ->set(
                DeleteSourceHandler::class,
                static function (ContainerInterface $container): DeleteSourceHandler {
                    $useCase = $container->get(DeleteSourceUseCaseInterface::class);
                    $responseFactory = $container->get(ResponseFactoryInterface::class);

                    if (!$useCase instanceof DeleteSourceUseCaseInterface) {
                        throw new LogicException('Delete source use case service is invalid.');
                    }

                    if (!$responseFactory instanceof ResponseFactoryInterface) {
                        throw new LogicException('Response factory service is invalid.');
                    }

                    return new DeleteSourceHandler($useCase, $responseFactory);
                },
            )
            ->set(
                SourceNotFoundExceptionHandler::class,
                static function (ContainerInterface $container): SourceNotFoundExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new SourceNotFoundExceptionHandler($problemDetails);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): SourceRouteRegistrar {
                    $delete = $container->get(DeleteSourceHandler::class);

                    if (!$delete instanceof DeleteSourceHandler) {
                        throw new LogicException('Delete source handler service is invalid.');
                    }

                    return new SourceRouteRegistrar($delete);
                },
            );
    }
}
