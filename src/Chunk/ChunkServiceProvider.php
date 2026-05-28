<?php

declare(strict_types=1);

namespace NeneCorpus\Chunk;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use Psr\Container\ContainerInterface;

final readonly class ChunkServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder->set(
            ChunkRepositoryInterface::class,
            static function (ContainerInterface $container): ChunkRepositoryInterface {
                $query = $container->get(DatabaseQueryExecutorInterface::class);
                $orgIdHolder = $container->get(RequestScopedOrgIdHolder::class);

                if (!$query instanceof DatabaseQueryExecutorInterface) {
                    throw new LogicException('Database query executor service is invalid.');
                }

                if (!$orgIdHolder instanceof RequestScopedOrgIdHolder) {
                    throw new LogicException('RequestScopedOrgIdHolder service is invalid.');
                }

                return new PdoChunkRepository($query, $orgIdHolder);
            },
        );
    }
}
