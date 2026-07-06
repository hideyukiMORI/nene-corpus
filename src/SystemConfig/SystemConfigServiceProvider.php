<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class SystemConfigServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.system_config';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                SystemConfigRepositoryInterface::class,
                static function (ContainerInterface $c): SystemConfigRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $clock = $c->get(ClockInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    return new PdoSystemConfigRepository($query, $clock);
                },
            )
            ->set(
                GetSystemConfigUseCaseInterface::class,
                static function (ContainerInterface $c): GetSystemConfigUseCaseInterface {
                    $repo = $c->get(SystemConfigRepositoryInterface::class);

                    if (!$repo instanceof SystemConfigRepositoryInterface) {
                        throw new LogicException('System config repository service is invalid.');
                    }

                    return new GetSystemConfigUseCase($repo);
                },
            )
            ->set(
                UpdateSystemConfigUseCaseInterface::class,
                static function (ContainerInterface $c): UpdateSystemConfigUseCaseInterface {
                    $repo = $c->get(SystemConfigRepositoryInterface::class);

                    if (!$repo instanceof SystemConfigRepositoryInterface) {
                        throw new LogicException('System config repository service is invalid.');
                    }

                    return new UpdateSystemConfigUseCase($repo);
                },
            )
            ->set(
                GetSystemConfigHandler::class,
                static function (ContainerInterface $c): GetSystemConfigHandler {
                    $uc   = $c->get(GetSystemConfigUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetSystemConfigUseCaseInterface) {
                        throw new LogicException('GetSystemConfig use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetSystemConfigHandler($uc, $json);
                },
            )
            ->set(
                UpdateSystemConfigHandler::class,
                static function (ContainerInterface $c): UpdateSystemConfigHandler {
                    $uc   = $c->get(UpdateSystemConfigUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof UpdateSystemConfigUseCaseInterface) {
                        throw new LogicException('UpdateSystemConfig use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateSystemConfigHandler($uc, $json);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $c): SystemConfigRouteRegistrar {
                    $get    = $c->get(GetSystemConfigHandler::class);
                    $update = $c->get(UpdateSystemConfigHandler::class);

                    if (!$get instanceof GetSystemConfigHandler) {
                        throw new LogicException('GetSystemConfig handler service is invalid.');
                    }

                    if (!$update instanceof UpdateSystemConfigHandler) {
                        throw new LogicException('UpdateSystemConfig handler service is invalid.');
                    }

                    return new SystemConfigRouteRegistrar($get, $update);
                },
            );
    }
}
