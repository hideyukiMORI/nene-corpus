<?php

declare(strict_types=1);

namespace NeneCorpus\RateLimit;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\ChatLimits\ChatLimitsRepositoryInterface;
use Psr\Container\ContainerInterface;

final readonly class RateLimitServiceProvider implements ServiceProviderInterface
{
    public const CHAT_RATE_LIMIT_MIDDLEWARE = 'nene-corpus.middleware.chat_rate_limit';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                RateLimitStorageInterface::class,
                static function (ContainerInterface $container): RateLimitStorageInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoRateLimitStorage($query);
                },
            )
            ->set(
                self::CHAT_RATE_LIMIT_MIDDLEWARE,
                static function (ContainerInterface $container): ConsumerChatRateLimitMiddleware {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    $storage = $container->get(RateLimitStorageInterface::class);
                    $limitsRepository = $container->get(ChatLimitsRepositoryInterface::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    if (!$storage instanceof RateLimitStorageInterface) {
                        throw new LogicException('Rate limit storage service is invalid.');
                    }

                    if (!$limitsRepository instanceof ChatLimitsRepositoryInterface) {
                        throw new LogicException('Chat limits repository service is invalid.');
                    }

                    return new ConsumerChatRateLimitMiddleware($problemDetails, $storage, $limitsRepository);
                },
            );
    }
}
