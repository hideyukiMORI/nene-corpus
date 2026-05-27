<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;

final readonly class AnalyticsServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.analytics';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                AnalyticsRepositoryInterface::class,
                static function (ContainerInterface $container): AnalyticsRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoAnalyticsRepository($query);
                },
            )
            ->set(
                GetAnalyticsSummaryUseCaseInterface::class,
                static function (ContainerInterface $container): GetAnalyticsSummaryUseCaseInterface {
                    $repo = $container->get(AnalyticsRepositoryInterface::class);

                    if (!$repo instanceof AnalyticsRepositoryInterface) {
                        throw new LogicException('Analytics repository service is invalid.');
                    }

                    return new GetAnalyticsSummaryUseCase($repo);
                },
            )
            ->set(
                GetTopQuestionsUseCaseInterface::class,
                static function (ContainerInterface $container): GetTopQuestionsUseCaseInterface {
                    $repo = $container->get(AnalyticsRepositoryInterface::class);

                    if (!$repo instanceof AnalyticsRepositoryInterface) {
                        throw new LogicException('Analytics repository service is invalid.');
                    }

                    return new GetTopQuestionsUseCase($repo);
                },
            )
            ->set(
                ExportConversationsUseCaseInterface::class,
                static function (ContainerInterface $container): ExportConversationsUseCaseInterface {
                    $repo = $container->get(AnalyticsRepositoryInterface::class);

                    if (!$repo instanceof AnalyticsRepositoryInterface) {
                        throw new LogicException('Analytics repository service is invalid.');
                    }

                    return new ExportConversationsUseCase($repo);
                },
            )
            ->set(
                GetAnalyticsSummaryHandler::class,
                static function (ContainerInterface $container): GetAnalyticsSummaryHandler {
                    $useCase  = $container->get(GetAnalyticsSummaryUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetAnalyticsSummaryUseCaseInterface) {
                        throw new LogicException('GetAnalyticsSummaryUseCase service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetAnalyticsSummaryHandler($useCase, $response);
                },
            )
            ->set(
                GetTopQuestionsHandler::class,
                static function (ContainerInterface $container): GetTopQuestionsHandler {
                    $useCase  = $container->get(GetTopQuestionsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetTopQuestionsUseCaseInterface) {
                        throw new LogicException('GetTopQuestionsUseCase service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetTopQuestionsHandler($useCase, $response);
                },
            )
            ->set(
                ExportConversationsHandler::class,
                static function (ContainerInterface $container): ExportConversationsHandler {
                    $useCase         = $container->get(ExportConversationsUseCaseInterface::class);
                    $responseFactory = $container->get(ResponseFactoryInterface::class);
                    $streamFactory   = $container->get(StreamFactoryInterface::class);

                    if (!$useCase instanceof ExportConversationsUseCaseInterface) {
                        throw new LogicException('ExportConversationsUseCase service is invalid.');
                    }

                    if (!$responseFactory instanceof ResponseFactoryInterface) {
                        throw new LogicException('ResponseFactory service is invalid.');
                    }

                    if (!$streamFactory instanceof StreamFactoryInterface) {
                        throw new LogicException('StreamFactory service is invalid.');
                    }

                    return new ExportConversationsHandler($useCase, $responseFactory, $streamFactory);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): AnalyticsRouteRegistrar {
                    $summary      = $container->get(GetAnalyticsSummaryHandler::class);
                    $topQuestions = $container->get(GetTopQuestionsHandler::class);
                    $export       = $container->get(ExportConversationsHandler::class);

                    if (!$summary instanceof GetAnalyticsSummaryHandler) {
                        throw new LogicException('GetAnalyticsSummaryHandler service is invalid.');
                    }

                    if (!$topQuestions instanceof GetTopQuestionsHandler) {
                        throw new LogicException('GetTopQuestionsHandler service is invalid.');
                    }

                    if (!$export instanceof ExportConversationsHandler) {
                        throw new LogicException('ExportConversationsHandler service is invalid.');
                    }

                    return new AnalyticsRouteRegistrar($summary, $topQuestions, $export);
                },
            );
    }
}
