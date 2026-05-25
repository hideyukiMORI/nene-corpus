<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use NeneCorpus\Http\RuntimeServiceProvider;
use NeneCorpus\Ingestion\UploadFilenameSanitizer;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;

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
                HeroImageStorage::class,
                static function (ContainerInterface $container): HeroImageStorage {
                    $projectRoot = $container->get(RuntimeServiceProvider::PROJECT_ROOT);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    return new HeroImageStorage($projectRoot . '/storage/uploads/hero');
                },
            )
            ->set(
                HeroImageUploadValidator::class,
                static function (ContainerInterface $container): HeroImageUploadValidator {
                    $sanitizer = $container->get(UploadFilenameSanitizer::class);

                    if (!$sanitizer instanceof UploadFilenameSanitizer) {
                        throw new LogicException('Upload filename sanitizer service is invalid.');
                    }

                    return new HeroImageUploadValidator($sanitizer);
                },
            )
            ->set(
                UploadHeroImageUseCaseInterface::class,
                static function (ContainerInterface $container): UploadHeroImageUseCaseInterface {
                    $validator = $container->get(HeroImageUploadValidator::class);
                    $storage = $container->get(HeroImageStorage::class);

                    if (!$validator instanceof HeroImageUploadValidator) {
                        throw new LogicException('Hero image upload validator service is invalid.');
                    }

                    if (!$storage instanceof HeroImageStorage) {
                        throw new LogicException('Hero image storage service is invalid.');
                    }

                    return new UploadHeroImageUseCase($validator, $storage);
                },
            )
            ->set(
                UploadHeroImageHandler::class,
                static function (ContainerInterface $container): UploadHeroImageHandler {
                    $useCase = $container->get(UploadHeroImageUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof UploadHeroImageUseCaseInterface) {
                        throw new LogicException('Upload hero image use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UploadHeroImageHandler($useCase, $response);
                },
            )
            ->set(
                ServeHeroImageHandler::class,
                static function (ContainerInterface $container): ServeHeroImageHandler {
                    $storage = $container->get(HeroImageStorage::class);
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    $responseFactory = $container->get(ResponseFactoryInterface::class);
                    $streamFactory = $container->get(StreamFactoryInterface::class);

                    if (!$storage instanceof HeroImageStorage) {
                        throw new LogicException('Hero image storage service is invalid.');
                    }

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    if (!$responseFactory instanceof ResponseFactoryInterface) {
                        throw new LogicException('Response factory service is invalid.');
                    }

                    if (!$streamFactory instanceof StreamFactoryInterface) {
                        throw new LogicException('Stream factory service is invalid.');
                    }

                    return new ServeHeroImageHandler(
                        $storage,
                        $problemDetails,
                        $responseFactory,
                        $streamFactory,
                    );
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): AppearanceRouteRegistrar {
                    $getAdmin = $container->get(GetAppearanceSettingsHandler::class);
                    $updateAdmin = $container->get(UpdateAppearanceSettingsHandler::class);
                    $getWidget = $container->get(GetWidgetAppearanceHandler::class);
                    $uploadHeroImage = $container->get(UploadHeroImageHandler::class);
                    $serveHeroImage = $container->get(ServeHeroImageHandler::class);

                    if (!$getAdmin instanceof GetAppearanceSettingsHandler) {
                        throw new LogicException('Get appearance settings handler service is invalid.');
                    }

                    if (!$updateAdmin instanceof UpdateAppearanceSettingsHandler) {
                        throw new LogicException('Update appearance settings handler service is invalid.');
                    }

                    if (!$getWidget instanceof GetWidgetAppearanceHandler) {
                        throw new LogicException('Get widget appearance handler service is invalid.');
                    }

                    if (!$uploadHeroImage instanceof UploadHeroImageHandler) {
                        throw new LogicException('Upload hero image handler service is invalid.');
                    }

                    if (!$serveHeroImage instanceof ServeHeroImageHandler) {
                        throw new LogicException('Serve hero image handler service is invalid.');
                    }

                    return new AppearanceRouteRegistrar(
                        $getAdmin,
                        $updateAdmin,
                        $getWidget,
                        $uploadHeroImage,
                        $serveHeroImage,
                    );
                },
            );
    }
}
