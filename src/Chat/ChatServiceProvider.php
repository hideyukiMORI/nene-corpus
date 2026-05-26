<?php

declare(strict_types=1);

namespace NeneCorpus\Chat;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use NeneCorpus\ChatLimits\ChatLimitsRepositoryInterface;
use NeneCorpus\ChatLimits\ChatTokenTrackerInterface;
use NeneCorpus\Llm\GenerateChatReplyUseCaseInterface;
use NeneCorpus\Message\ChatMessageRepositoryInterface;
use NeneCorpus\Session\ChatSessionRepositoryInterface;
use Psr\Container\ContainerInterface;

final readonly class ChatServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.chat';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                CreateChatSessionUseCaseInterface::class,
                static function (ContainerInterface $container): CreateChatSessionUseCaseInterface {
                    $sessions = $container->get(ChatSessionRepositoryInterface::class);

                    if (!$sessions instanceof ChatSessionRepositoryInterface) {
                        throw new LogicException('Chat session repository service is invalid.');
                    }

                    return new CreateChatSessionUseCase($sessions);
                },
            )
            ->set(
                SendChatMessageUseCaseInterface::class,
                static function (ContainerInterface $container): SendChatMessageUseCaseInterface {
                    $sessions = $container->get(ChatSessionRepositoryInterface::class);
                    $messages = $container->get(ChatMessageRepositoryInterface::class);
                    $generateReply = $container->get(GenerateChatReplyUseCaseInterface::class);
                    $limitsRepository = $container->get(ChatLimitsRepositoryInterface::class);
                    $tokenTracker = $container->get(ChatTokenTrackerInterface::class);

                    if (!$sessions instanceof ChatSessionRepositoryInterface) {
                        throw new LogicException('Chat session repository service is invalid.');
                    }

                    if (!$messages instanceof ChatMessageRepositoryInterface) {
                        throw new LogicException('Chat message repository service is invalid.');
                    }

                    if (!$generateReply instanceof GenerateChatReplyUseCaseInterface) {
                        throw new LogicException('Generate chat reply use case service is invalid.');
                    }

                    if (!$limitsRepository instanceof ChatLimitsRepositoryInterface) {
                        throw new LogicException('Chat limits repository service is invalid.');
                    }

                    if (!$tokenTracker instanceof ChatTokenTrackerInterface) {
                        throw new LogicException('Chat token tracker service is invalid.');
                    }

                    return new SendChatMessageUseCase($sessions, $messages, $generateReply, $limitsRepository, $tokenTracker);
                },
            )
            ->set(
                CreateChatSessionHandler::class,
                static function (ContainerInterface $container): CreateChatSessionHandler {
                    $useCase = $container->get(CreateChatSessionUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof CreateChatSessionUseCaseInterface) {
                        throw new LogicException('Create chat session use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CreateChatSessionHandler($useCase, $response);
                },
            )
            ->set(
                SendChatMessageHandler::class,
                static function (ContainerInterface $container): SendChatMessageHandler {
                    $useCase = $container->get(SendChatMessageUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof SendChatMessageUseCaseInterface) {
                        throw new LogicException('Send chat message use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new SendChatMessageHandler($useCase, $response);
                },
            )
            ->set(
                ChatSessionNotFoundExceptionHandler::class,
                static function (ContainerInterface $container): ChatSessionNotFoundExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new ChatSessionNotFoundExceptionHandler($problemDetails);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): ChatRouteRegistrar {
                    $createSession = $container->get(CreateChatSessionHandler::class);
                    $sendMessage = $container->get(SendChatMessageHandler::class);

                    if (!$createSession instanceof CreateChatSessionHandler) {
                        throw new LogicException('Create chat session handler service is invalid.');
                    }

                    if (!$sendMessage instanceof SendChatMessageHandler) {
                        throw new LogicException('Send chat message handler service is invalid.');
                    }

                    return new ChatRouteRegistrar($createSession, $sendMessage);
                },
            );
    }
}
