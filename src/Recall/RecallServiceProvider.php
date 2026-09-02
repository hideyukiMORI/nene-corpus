<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

use LogicException;
use Nene2\Config\AppConfig;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use NeneCorpus\Organization\OrganizationRepositoryInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use Psr\Container\ContainerInterface;

/**
 * Wiring for the optional Recall backend, in the shape of
 * {@see \NeneCorpus\Upstream\UpstreamServiceProvider}: the config decides which
 * client is bound, and nothing else in the container has to know.
 */
final readonly class RecallServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                RecallConfig::class,
                static function (ContainerInterface $container): RecallConfig {
                    // Resolving AppConfig is what loads `.env` into $_ENV
                    // (ConfigLoader::load()). Recall's settings are not part of
                    // AppConfig, so without this the console entry point — which
                    // reaches Recall before anything else touches AppConfig —
                    // would read an unpopulated environment and quietly decide
                    // that Recall is not configured.
                    $container->get(AppConfig::class);

                    return RecallConfig::fromEnvironment();
                },
            )
            ->set(
                RecallHttpTransportInterface::class,
                static function (ContainerInterface $container): RecallHttpTransportInterface {
                    return new CurlRecallHttpTransport(self::config($container)->timeoutSeconds);
                },
            )
            ->set(
                RecallClientInterface::class,
                static function (ContainerInterface $container): RecallClientInterface {
                    $config = self::config($container);

                    if (!$config->isConfigured()) {
                        return new NullRecallClient();
                    }

                    $transport = $container->get(RecallHttpTransportInterface::class);

                    if (!$transport instanceof RecallHttpTransportInterface) {
                        throw new LogicException('Recall HTTP transport service is invalid.');
                    }

                    return new HttpRecallClient($config, $transport);
                },
            )
            ->set(
                RecallReindexReaderInterface::class,
                static function (ContainerInterface $container): RecallReindexReaderInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoRecallReindexReader($query, self::orgIdHolder($container));
                },
            )
            ->set(
                RecallReindexer::class,
                static function (ContainerInterface $container): RecallReindexer {
                    $client = $container->get(RecallClientInterface::class);
                    $reader = $container->get(RecallReindexReaderInterface::class);

                    if (!$client instanceof RecallClientInterface) {
                        throw new LogicException('Recall client service is invalid.');
                    }

                    if (!$reader instanceof RecallReindexReaderInterface) {
                        throw new LogicException('Recall reindex reader service is invalid.');
                    }

                    return new RecallReindexer($client, $reader, self::orgIdHolder($container));
                },
            )
            ->set(
                RecallReindexCommand::class,
                static function (ContainerInterface $container): RecallReindexCommand {
                    $reindexer = $container->get(RecallReindexer::class);
                    $organizations = $container->get(OrganizationRepositoryInterface::class);

                    if (!$reindexer instanceof RecallReindexer) {
                        throw new LogicException('Recall reindexer service is invalid.');
                    }

                    if (!$organizations instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('Organization repository service is invalid.');
                    }

                    return new RecallReindexCommand(self::config($container), $reindexer, $organizations);
                },
            );
    }

    public static function config(ContainerInterface $container): RecallConfig
    {
        $config = $container->get(RecallConfig::class);

        if (!$config instanceof RecallConfig) {
            throw new LogicException('Recall config service is invalid.');
        }

        return $config;
    }

    public static function client(ContainerInterface $container): RecallClientInterface
    {
        $client = $container->get(RecallClientInterface::class);

        if (!$client instanceof RecallClientInterface) {
            throw new LogicException('Recall client service is invalid.');
        }

        return $client;
    }

    private static function orgIdHolder(ContainerInterface $container): RequestScopedOrgIdHolder
    {
        $holder = $container->get(RequestScopedOrgIdHolder::class);

        if (!$holder instanceof RequestScopedOrgIdHolder) {
            throw new LogicException('RequestScopedOrgIdHolder service is invalid.');
        }

        return $holder;
    }
}
