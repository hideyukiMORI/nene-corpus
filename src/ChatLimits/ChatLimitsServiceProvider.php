<?php

declare(strict_types=1);

namespace NeneCorpus\ChatLimits;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class ChatLimitsServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.chat_limits';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ChatLimitsRepositoryInterface::class,
                static function (ContainerInterface $container): ChatLimitsRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoChatLimitsRepository($query);
                },
            )
            ->set(
                ChatLimitsValidator::class,
                static fn (): ChatLimitsValidator => new ChatLimitsValidator(),
            )
            ->set(
                GetChatLimitsUseCaseInterface::class,
                static function (ContainerInterface $container): GetChatLimitsUseCaseInterface {
                    $repository = $container->get(ChatLimitsRepositoryInterface::class);

                    if (!$repository instanceof ChatLimitsRepositoryInterface) {
                        throw new LogicException('Chat limits repository service is invalid.');
                    }

                    return new GetChatLimitsUseCase($repository);
                },
            )
            ->set(
                UpdateChatLimitsUseCaseInterface::class,
                static function (ContainerInterface $container): UpdateChatLimitsUseCaseInterface {
                    $repository = $container->get(ChatLimitsRepositoryInterface::class);
                    $validator = $container->get(ChatLimitsValidator::class);

                    if (!$repository instanceof ChatLimitsRepositoryInterface) {
                        throw new LogicException('Chat limits repository service is invalid.');
                    }

                    if (!$validator instanceof ChatLimitsValidator) {
                        throw new LogicException('Chat limits validator service is invalid.');
                    }

                    return new UpdateChatLimitsUseCase($repository, $validator);
                },
            )
            ->set(
                GetChatLimitsHandler::class,
                static function (ContainerInterface $container): GetChatLimitsHandler {
                    $useCase = $container->get(GetChatLimitsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetChatLimitsUseCaseInterface) {
                        throw new LogicException('Get chat limits use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetChatLimitsHandler($useCase, $response);
                },
            )
            ->set(
                UpdateChatLimitsHandler::class,
                static function (ContainerInterface $container): UpdateChatLimitsHandler {
                    $useCase = $container->get(UpdateChatLimitsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof UpdateChatLimitsUseCaseInterface) {
                        throw new LogicException('Update chat limits use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateChatLimitsHandler($useCase, $response);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): ChatLimitsRouteRegistrar {
                    $get = $container->get(GetChatLimitsHandler::class);
                    $update = $container->get(UpdateChatLimitsHandler::class);

                    if (!$get instanceof GetChatLimitsHandler) {
                        throw new LogicException('Get chat limits handler service is invalid.');
                    }

                    if (!$update instanceof UpdateChatLimitsHandler) {
                        throw new LogicException('Update chat limits handler service is invalid.');
                    }

                    return new ChatLimitsRouteRegistrar($get, $update);
                },
            );
    }
}
