<?php

declare(strict_types=1);

namespace NeneCorpus\Search;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use NeneCorpus\Recall\RecallServiceProvider;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

final readonly class SearchServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ChunkSearchRepositoryInterface::class,
                static function (ContainerInterface $container): ChunkSearchRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);
                    $orgIdHolder = $container->get(RequestScopedOrgIdHolder::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$orgIdHolder instanceof RequestScopedOrgIdHolder) {
                        throw new LogicException('RequestScopedOrgIdHolder service is invalid.');
                    }

                    $likeSearch = new PdoChunkSearchRepository($query, $orgIdHolder);
                    $recallConfig = RecallServiceProvider::config($container);

                    // Without NENE_RECALL_BASE_URL the LIKE search is the whole
                    // search stack, exactly as before this integration existed.
                    if (!$recallConfig->isConfigured()) {
                        return $likeSearch;
                    }

                    $logger = $container->get(LoggerInterface::class);

                    if (!$logger instanceof LoggerInterface) {
                        throw new LogicException('Logger service is invalid.');
                    }

                    return new RecallChunkSearchRepository(
                        recall: RecallServiceProvider::client($container),
                        guard: new PdoChunkSearchGuard($query, $orgIdHolder),
                        fallback: $likeSearch,
                        orgIdHolder: $orgIdHolder,
                        logger: $logger,
                        strict: $recallConfig->strict,
                    );
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
