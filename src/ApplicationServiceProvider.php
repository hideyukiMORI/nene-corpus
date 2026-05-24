<?php

declare(strict_types=1);

namespace NeneCorpus;

use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\DomainExceptionHandlerInterface;
use Psr\Container\ContainerInterface;

final readonly class ApplicationServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRARS = 'nene-corpus.route_registrars';

    public const EXCEPTION_HANDLERS = 'nene-corpus.exception_handlers';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                self::ROUTE_REGISTRARS,
                static fn (ContainerInterface $container): array => [],
            )
            ->set(
                self::EXCEPTION_HANDLERS,
                static function (ContainerInterface $container): array {
                    /** @var list<DomainExceptionHandlerInterface> $handlers */
                    $handlers = [];

                    return $handlers;
                },
            );
    }
}
