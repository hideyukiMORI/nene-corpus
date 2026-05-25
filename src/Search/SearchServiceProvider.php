<?php

declare(strict_types=1);

namespace NeneCorpus\Search;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Psr\Container\ContainerInterface;

final readonly class SearchServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ChunkSearchRepositoryInterface::class,
                static function (ContainerInterface $container): ChunkSearchRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoChunkSearchRepository($query);
                },
            )
            ->set(
                SearchChunksUseCaseInterface::class,
                static function (ContainerInterface $container): SearchChunksUseCaseInterface {
                    $search = $container->get(ChunkSearchRepositoryInterface::class);

                    if (!$search instanceof ChunkSearchRepositoryInterface) {
                        throw new LogicException('Chunk search repository service is invalid.');
                    }

                    return new SearchChunksUseCase($search);
                },
            );
    }
}
