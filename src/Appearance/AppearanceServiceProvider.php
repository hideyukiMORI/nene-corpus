<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class AppearanceServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.appearance';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                AppearanceSettingsRepositoryInterface::class,
                static function (ContainerInterface $container): AppearanceSettingsRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoAppearanceSettingsRepository($query);
                },
            )
            ->set(
                AppearanceSettingsValidator::class,
                static fn (): AppearanceSettingsValidator => new AppearanceSettingsValidator(),
            )
            ->set(
                GetAppearanceSettingsUseCaseInterface::class,
                static function (ContainerInterface $container): GetAppearanceSettingsUseCaseInterface {
                    $repository = $container->get(AppearanceSettingsRepositoryInterface::class);

                    if (!$repository instanceof AppearanceSettingsRepositoryInterface) {
                        throw new LogicException('Appearance settings repository service is invalid.');
                    }

                    return new GetAppearanceSettingsUseCase($repository);
                },
            )
            ->set(
                UpdateAppearanceSettingsUseCaseInterface::class,
                static function (ContainerInterface $container): UpdateAppearanceSettingsUseCaseInterface {
                    $repository = $container->get(AppearanceSettingsRepositoryInterface::class);
                    $validator = $container->get(AppearanceSettingsValidator::class);

                    if (!$repository instanceof AppearanceSettingsRepositoryInterface) {
                        throw new LogicException('Appearance settings repository service is invalid.');
                    }

                    if (!$validator instanceof AppearanceSettingsValidator) {
                        throw new LogicException('Appearance settings validator service is invalid.');
                    }

                    return new UpdateAppearanceSettingsUseCase($repository, $validator);
                },
            )
            ->set(
                GetAppearanceSettingsHandler::class,
                static function (ContainerInterface $container): GetAppearanceSettingsHandler {
                    $useCase = $container->get(GetAppearanceSettingsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetAppearanceSettingsUseCaseInterface) {
                        throw new LogicException('Get appearance settings use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetAppearanceSettingsHandler($useCase, $response);
                },
            )
            ->set(
                UpdateAppearanceSettingsHandler::class,
                static function (ContainerInterface $container): UpdateAppearanceSettingsHandler {
                    $useCase = $container->get(UpdateAppearanceSettingsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof UpdateAppearanceSettingsUseCaseInterface) {
                        throw new LogicException('Update appearance settings use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateAppearanceSettingsHandler($useCase, $response);
                },
            )
            ->set(
                GetWidgetAppearanceHandler::class,
                static function (ContainerInterface $container): GetWidgetAppearanceHandler {
                    $useCase = $container->get(GetAppearanceSettingsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetAppearanceSettingsUseCaseInterface) {
                        throw new LogicException('Get appearance settings use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetWidgetAppearanceHandler($useCase, $response);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): AppearanceRouteRegistrar {
                    $getAdmin = $container->get(GetAppearanceSettingsHandler::class);
                    $updateAdmin = $container->get(UpdateAppearanceSettingsHandler::class);
                    $getWidget = $container->get(GetWidgetAppearanceHandler::class);

                    if (!$getAdmin instanceof GetAppearanceSettingsHandler) {
                        throw new LogicException('Get appearance settings handler service is invalid.');
                    }

                    if (!$updateAdmin instanceof UpdateAppearanceSettingsHandler) {
                        throw new LogicException('Update appearance settings handler service is invalid.');
                    }

                    if (!$getWidget instanceof GetWidgetAppearanceHandler) {
                        throw new LogicException('Get widget appearance handler service is invalid.');
                    }

                    return new AppearanceRouteRegistrar($getAdmin, $updateAdmin, $getWidget);
                },
            );
    }
}
