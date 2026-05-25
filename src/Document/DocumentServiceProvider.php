<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Psr\Container\ContainerInterface;

final readonly class DocumentServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder->set(
            DocumentRepositoryInterface::class,
            static function (ContainerInterface $container): DocumentRepositoryInterface {
                $query = $container->get(DatabaseQueryExecutorInterface::class);

                if (!$query instanceof DatabaseQueryExecutorInterface) {
                    throw new LogicException('Database query executor service is invalid.');
                }

                return new PdoDocumentRepository($query);
            },
        );
    }
}
