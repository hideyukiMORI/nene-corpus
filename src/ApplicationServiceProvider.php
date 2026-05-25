<?php

declare(strict_types=1);

namespace NeneCorpus;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\DomainExceptionHandlerInterface;
use NeneCorpus\AdminAuth\AdminAuthRouteRegistrar;
use NeneCorpus\AdminAuth\AdminAuthServiceProvider;
use NeneCorpus\AdminAuth\InvalidAdminCredentialsExceptionHandler;
use NeneCorpus\Chunk\ChunkServiceProvider;
use NeneCorpus\Document\DocumentServiceProvider;
use NeneCorpus\Source\SourceServiceProvider;
use Psr\Container\ContainerInterface;

final readonly class ApplicationServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRARS = 'nene-corpus.route_registrars';

    public const EXCEPTION_HANDLERS = 'nene-corpus.exception_handlers';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->addProvider(new SourceServiceProvider())
            ->addProvider(new DocumentServiceProvider())
            ->addProvider(new ChunkServiceProvider())
            ->addProvider(new AdminAuthServiceProvider())
            ->set(
                self::ROUTE_REGISTRARS,
                static function (ContainerInterface $container): array {
                    $adminAuth = $container->get(AdminAuthServiceProvider::ROUTE_REGISTRAR);

                    if (!$adminAuth instanceof AdminAuthRouteRegistrar) {
                        throw new LogicException('Admin auth route registrar service is invalid.');
                    }

                    return [$adminAuth];
                },
            )
            ->set(
                self::EXCEPTION_HANDLERS,
                static function (ContainerInterface $container): array {
                    $invalidCredentials = $container->get(InvalidAdminCredentialsExceptionHandler::class);

                    if (!$invalidCredentials instanceof DomainExceptionHandlerInterface) {
                        throw new LogicException('Invalid admin credentials exception handler service is invalid.');
                    }

                    return [$invalidCredentials];
                },
            );
    }
}
