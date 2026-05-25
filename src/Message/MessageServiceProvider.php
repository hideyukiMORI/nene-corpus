<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Psr\Container\ContainerInterface;

final readonly class MessageServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder->set(
            ChatMessageRepositoryInterface::class,
            static function (ContainerInterface $container): ChatMessageRepositoryInterface {
                $query = $container->get(DatabaseQueryExecutorInterface::class);

                if (!$query instanceof DatabaseQueryExecutorInterface) {
                    throw new LogicException('Database query executor service is invalid.');
                }

                return new PdoChatMessageRepository($query);
            },
        );
    }
}
