<?php

declare(strict_types=1);

namespace NeneCorpus\Bootstrap;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class BootstrapServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.bootstrap';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                GetBootstrapInfoUseCaseInterface::class,
                static fn (): GetBootstrapInfoUseCaseInterface => new GetBootstrapInfoUseCase(),
            )
            ->set(
                GetBootstrapInfoHandler::class,
                static function (ContainerInterface $container): GetBootstrapInfoHandler {
                    $useCase  = $container->get(GetBootstrapInfoUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetBootstrapInfoUseCaseInterface) {
                        throw new LogicException('Get bootstrap info use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetBootstrapInfoHandler($useCase, $response);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): BootstrapRouteRegistrar {
                    $handler = $container->get(GetBootstrapInfoHandler::class);

                    if (!$handler instanceof GetBootstrapInfoHandler) {
                        throw new LogicException('Get bootstrap info handler service is invalid.');
                    }

                    return new BootstrapRouteRegistrar($handler);
                },
            );
    }
}
