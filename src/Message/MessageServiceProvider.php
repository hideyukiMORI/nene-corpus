<?php

declare(strict_types=1);

namespace NeneCorpus\Message;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\ClockInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use Psr\Container\ContainerInterface;

final readonly class MessageServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder->set(
            ChatMessageRepositoryInterface::class,
            static function (ContainerInterface $container): ChatMessageRepositoryInterface {
                $query = $container->get(DatabaseQueryExecutorInterface::class);
                $holder = $container->get(RequestScopedOrgIdHolder::class);

                if (!$query instanceof DatabaseQueryExecutorInterface) {
                    throw new LogicException('Database query executor service is invalid.');
                }

                if (!$holder instanceof RequestScopedOrgIdHolder) {
                    throw new LogicException('RequestScopedOrgIdHolder service is invalid.');
                }

                $clock = $container->get(ClockInterface::class);

                if (!$clock instanceof ClockInterface) {
                    throw new LogicException('Clock service is invalid.');
                }

                return new PdoChatMessageRepository($query, $holder, $clock);
            },
        );
    }
}
