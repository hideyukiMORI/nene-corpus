<?php

declare(strict_types=1);

namespace NeneCorpus\RateLimit;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\ChatLimits\ChatLimitsRepositoryInterface;
use NeneCorpus\ChatLimits\ChatTokenTrackerInterface;
use NeneCorpus\Notification\RateLimitNotifier;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
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
                    $query  = $container->get(DatabaseQueryExecutorInterface::class);
                    $holder = $container->get(RequestScopedOrgIdHolder::class);
                    $clock  = $container->get(ClockInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$holder instanceof RequestScopedOrgIdHolder) {
                        throw new LogicException('RequestScopedOrgIdHolder service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    return new PdoRateLimitStorage($query, $holder, $clock);
                },
            )
            ->set(
                self::CHAT_RATE_LIMIT_MIDDLEWARE,
                static function (ContainerInterface $container): ConsumerChatRateLimitMiddleware {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    $storage = $container->get(RateLimitStorageInterface::class);
                    $limitsRepository = $container->get(ChatLimitsRepositoryInterface::class);
                    $tokenTracker = $container->get(ChatTokenTrackerInterface::class);
                    $clock = $container->get(ClockInterface::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    if (!$storage instanceof RateLimitStorageInterface) {
                        throw new LogicException('Rate limit storage service is invalid.');
                    }

                    if (!$limitsRepository instanceof ChatLimitsRepositoryInterface) {
                        throw new LogicException('Chat limits repository service is invalid.');
                    }

                    if (!$tokenTracker instanceof ChatTokenTrackerInterface) {
                        throw new LogicException('Chat token tracker service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    /** @var RateLimitNotifier|null $notifier */
                    $notifier = $container->has(RateLimitNotifier::class) ? $container->get(RateLimitNotifier::class) : null;

                    return new ConsumerChatRateLimitMiddleware($problemDetails, $storage, $limitsRepository, $tokenTracker, $clock, $notifier instanceof RateLimitNotifier ? $notifier : null);
                },
            );
    }
}
