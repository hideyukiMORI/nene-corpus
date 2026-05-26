<?php

declare(strict_types=1);

namespace NeneCorpus\ChatSettings;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class ChatSettingsServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.chat_settings';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ChatSettingsRepositoryInterface::class,
                static function (ContainerInterface $container): ChatSettingsRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoChatSettingsRepository($query);
                },
            )
            ->set(
                ChatSettingsValidator::class,
                static fn (): ChatSettingsValidator => new ChatSettingsValidator(),
            )
            ->set(
                GetChatSettingsUseCaseInterface::class,
                static function (ContainerInterface $container): GetChatSettingsUseCaseInterface {
                    $repository = $container->get(ChatSettingsRepositoryInterface::class);

                    if (!$repository instanceof ChatSettingsRepositoryInterface) {
                        throw new LogicException('Chat settings repository service is invalid.');
                    }

                    return new GetChatSettingsUseCase($repository);
                },
            )
            ->set(
                UpdateChatSettingsUseCaseInterface::class,
                static function (ContainerInterface $container): UpdateChatSettingsUseCaseInterface {
                    $repository = $container->get(ChatSettingsRepositoryInterface::class);
                    $validator = $container->get(ChatSettingsValidator::class);

                    if (!$repository instanceof ChatSettingsRepositoryInterface) {
                        throw new LogicException('Chat settings repository service is invalid.');
                    }

                    if (!$validator instanceof ChatSettingsValidator) {
                        throw new LogicException('Chat settings validator service is invalid.');
                    }

                    return new UpdateChatSettingsUseCase($repository, $validator);
                },
            )
            ->set(
                GetChatSettingsHandler::class,
                static function (ContainerInterface $container): GetChatSettingsHandler {
                    $useCase = $container->get(GetChatSettingsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetChatSettingsUseCaseInterface) {
                        throw new LogicException('Get chat settings use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetChatSettingsHandler($useCase, $response);
                },
            )
            ->set(
                UpdateChatSettingsHandler::class,
                static function (ContainerInterface $container): UpdateChatSettingsHandler {
                    $useCase = $container->get(UpdateChatSettingsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof UpdateChatSettingsUseCaseInterface) {
                        throw new LogicException('Update chat settings use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateChatSettingsHandler($useCase, $response);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): ChatSettingsRouteRegistrar {
                    $get = $container->get(GetChatSettingsHandler::class);
                    $update = $container->get(UpdateChatSettingsHandler::class);

                    if (!$get instanceof GetChatSettingsHandler) {
                        throw new LogicException('Get chat settings handler service is invalid.');
                    }

                    if (!$update instanceof UpdateChatSettingsHandler) {
                        throw new LogicException('Update chat settings handler service is invalid.');
                    }

                    return new ChatSettingsRouteRegistrar($get, $update);
                },
            );
    }
}
