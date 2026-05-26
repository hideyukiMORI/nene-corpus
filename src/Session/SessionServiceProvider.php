<?php

declare(strict_types=1);

namespace NeneCorpus\Session;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use NeneCorpus\Message\ChatMessageRepositoryInterface;
use NeneCorpus\Message\ListChatSessionMessagesHandler;
use NeneCorpus\Message\ListChatSessionMessagesUseCase;
use NeneCorpus\Message\ListChatSessionMessagesUseCaseInterface;
use Psr\Container\ContainerInterface;

final readonly class SessionServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.admin_chat';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ChatSessionRepositoryInterface::class,
                static function (ContainerInterface $container): ChatSessionRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoChatSessionRepository($query);
                },
            )
            ->set(
                ListChatSessionsUseCaseInterface::class,
                static function (ContainerInterface $container): ListChatSessionsUseCaseInterface {
                    $sessions = $container->get(ChatSessionRepositoryInterface::class);

                    if (!$sessions instanceof ChatSessionRepositoryInterface) {
                        throw new LogicException('Chat session repository service is invalid.');
                    }

                    return new ListChatSessionsUseCase($sessions);
                },
            )
            ->set(
                ListChatSessionsHandler::class,
                static function (ContainerInterface $container): ListChatSessionsHandler {
                    $useCase = $container->get(ListChatSessionsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof ListChatSessionsUseCaseInterface) {
                        throw new LogicException('List chat sessions use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListChatSessionsHandler($useCase, $response);
                },
            )
            ->set(
                ListChatSessionMessagesUseCaseInterface::class,
                static function (ContainerInterface $container): ListChatSessionMessagesUseCaseInterface {
                    $sessions = $container->get(ChatSessionRepositoryInterface::class);
                    $messages = $container->get(ChatMessageRepositoryInterface::class);

                    if (!$sessions instanceof ChatSessionRepositoryInterface) {
                        throw new LogicException('Chat session repository service is invalid.');
                    }

                    if (!$messages instanceof ChatMessageRepositoryInterface) {
                        throw new LogicException('Chat message repository service is invalid.');
                    }

                    return new ListChatSessionMessagesUseCase($sessions, $messages);
                },
            )
            ->set(
                ListChatSessionMessagesHandler::class,
                static function (ContainerInterface $container): ListChatSessionMessagesHandler {
                    $useCase = $container->get(ListChatSessionMessagesUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof ListChatSessionMessagesUseCaseInterface) {
                        throw new LogicException('List chat session messages use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListChatSessionMessagesHandler($useCase, $response);
                },
            )
            ->set(
                CleanupChatSessionsUseCaseInterface::class,
                static function (ContainerInterface $container): CleanupChatSessionsUseCaseInterface {
                    $sessions = $container->get(ChatSessionRepositoryInterface::class);

                    if (!$sessions instanceof ChatSessionRepositoryInterface) {
                        throw new LogicException('Chat session repository service is invalid.');
                    }

                    return new CleanupChatSessionsUseCase($sessions);
                },
            )
            ->set(
                CleanupChatSessionsHandler::class,
                static function (ContainerInterface $container): CleanupChatSessionsHandler {
                    $useCase  = $container->get(CleanupChatSessionsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof CleanupChatSessionsUseCaseInterface) {
                        throw new LogicException('Cleanup chat sessions use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CleanupChatSessionsHandler($useCase, $response);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): AdminChatRouteRegistrar {
                    $listSessions    = $container->get(ListChatSessionsHandler::class);
                    $listMessages    = $container->get(ListChatSessionMessagesHandler::class);
                    $cleanupSessions = $container->get(CleanupChatSessionsHandler::class);

                    if (!$listSessions instanceof ListChatSessionsHandler) {
                        throw new LogicException('List chat sessions handler service is invalid.');
                    }

                    if (!$listMessages instanceof ListChatSessionMessagesHandler) {
                        throw new LogicException('List chat session messages handler service is invalid.');
                    }

                    if (!$cleanupSessions instanceof CleanupChatSessionsHandler) {
                        throw new LogicException('Cleanup chat sessions handler service is invalid.');
                    }

                    return new AdminChatRouteRegistrar($listSessions, $listMessages, $cleanupSessions);
                },
            );
    }
}
