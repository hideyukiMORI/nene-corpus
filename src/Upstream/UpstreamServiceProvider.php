<?php

declare(strict_types=1);

namespace NeneCorpus\Upstream;

use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Psr\Container\ContainerInterface;

final readonly class UpstreamServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                NeneRecordsConfig::class,
                static fn (): NeneRecordsConfig => NeneRecordsConfig::fromEnvironment(),
            )
            ->set(
                NeneRecordsClientInterface::class,
                static function (ContainerInterface $container): NeneRecordsClientInterface {
                    $config = $container->get(NeneRecordsConfig::class);

                    if (!$config instanceof NeneRecordsConfig || !$config->isConfigured()) {
                        return new NullNeneRecordsClient();
                    }

                    return new HttpNeneRecordsClient($config);
                },
            );
    }
}
