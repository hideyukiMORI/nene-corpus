<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use LogicException;
use Nene2\Auth\BearerTokenMiddleware;
use Nene2\Auth\LocalBearerTokenVerifier;
use Nene2\Auth\TokenIssuerInterface;
use Nene2\Config\AppConfig;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class AdminAuthServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.admin_auth';

    public const AUTH_MIDDLEWARE = 'nene-corpus.middleware.admin_auth';

    public const TOKEN_ISSUER = 'nene-corpus.admin_auth.token_issuer';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                AdminUserRepositoryInterface::class,
                static function (ContainerInterface $container): AdminUserRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoAdminUserRepository($query);
                },
            )
            ->set(
                self::TOKEN_ISSUER,
                static function (ContainerInterface $container): ?TokenIssuerInterface {
                    $config = $container->get(AppConfig::class);

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    if ($config->localJwtSecret === null) {
                        return null;
                    }

                    return new LocalBearerTokenVerifier($config->localJwtSecret);
                },
            )
            ->set(
                LoginAdminUseCaseInterface::class,
                static function (ContainerInterface $container): LoginAdminUseCaseInterface {
                    $users = $container->get(AdminUserRepositoryInterface::class);
                    $issuer = $container->get(self::TOKEN_ISSUER);

                    if (!$users instanceof AdminUserRepositoryInterface) {
                        throw new LogicException('Admin user repository service is invalid.');
                    }

                    $issuer = $issuer instanceof TokenIssuerInterface ? $issuer : null;

                    return new LoginAdminUseCase($users, $issuer);
                },
            )
            ->set(
                LoginAdminHandler::class,
                static function (ContainerInterface $container): LoginAdminHandler {
                    $useCase = $container->get(LoginAdminUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof LoginAdminUseCaseInterface) {
                        throw new LogicException('Login admin use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new LoginAdminHandler($useCase, $response);
                },
            )
            ->set(
                GetAdminMeHandler::class,
                static function (ContainerInterface $container): GetAdminMeHandler {
                    $response = $container->get(JsonResponseFactory::class);
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new GetAdminMeHandler($response, $problemDetails);
                },
            )
            ->set(
                InvalidAdminCredentialsExceptionHandler::class,
                static function (ContainerInterface $container): InvalidAdminCredentialsExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new InvalidAdminCredentialsExceptionHandler($problemDetails);
                },
            )
            ->set(
                AdminJwtNotConfiguredExceptionHandler::class,
                static function (ContainerInterface $container): AdminJwtNotConfiguredExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new AdminJwtNotConfiguredExceptionHandler($problemDetails);
                },
            )
            ->set(
                ChangeAdminPasswordUseCaseInterface::class,
                static function (ContainerInterface $container): ChangeAdminPasswordUseCaseInterface {
                    $users = $container->get(AdminUserRepositoryInterface::class);

                    if (!$users instanceof AdminUserRepositoryInterface) {
                        throw new LogicException('Admin user repository service is invalid.');
                    }

                    return new ChangeAdminPasswordUseCase($users);
                },
            )
            ->set(
                ChangeAdminPasswordHandler::class,
                static function (ContainerInterface $container): ChangeAdminPasswordHandler {
                    $useCase  = $container->get(ChangeAdminPasswordUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof ChangeAdminPasswordUseCaseInterface) {
                        throw new LogicException('Change admin password use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ChangeAdminPasswordHandler($useCase, $response);
                },
            )
            ->set(
                ChangeAdminEmailUseCaseInterface::class,
                static function (ContainerInterface $container): ChangeAdminEmailUseCaseInterface {
                    $users = $container->get(AdminUserRepositoryInterface::class);

                    if (!$users instanceof AdminUserRepositoryInterface) {
                        throw new LogicException('Admin user repository service is invalid.');
                    }

                    return new ChangeAdminEmailUseCase($users);
                },
            )
            ->set(
                ChangeAdminEmailHandler::class,
                static function (ContainerInterface $container): ChangeAdminEmailHandler {
                    $useCase  = $container->get(ChangeAdminEmailUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof ChangeAdminEmailUseCaseInterface) {
                        throw new LogicException('Change admin email use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ChangeAdminEmailHandler($useCase, $response);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): AdminAuthRouteRegistrar {
                    $login          = $container->get(LoginAdminHandler::class);
                    $me             = $container->get(GetAdminMeHandler::class);
                    $changePassword = $container->get(ChangeAdminPasswordHandler::class);
                    $changeEmail    = $container->get(ChangeAdminEmailHandler::class);

                    if (!$login instanceof LoginAdminHandler) {
                        throw new LogicException('Login admin handler service is invalid.');
                    }

                    if (!$me instanceof GetAdminMeHandler) {
                        throw new LogicException('Get admin me handler service is invalid.');
                    }

                    if (!$changePassword instanceof ChangeAdminPasswordHandler) {
                        throw new LogicException('Change admin password handler service is invalid.');
                    }

                    if (!$changeEmail instanceof ChangeAdminEmailHandler) {
                        throw new LogicException('Change admin email handler service is invalid.');
                    }

                    return new AdminAuthRouteRegistrar($login, $me, $changePassword, $changeEmail);
                },
            )
            ->set(
                self::AUTH_MIDDLEWARE,
                static function (ContainerInterface $container): ?AdminBearerTokenMiddleware {
                    $config = $container->get(AppConfig::class);
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    if ($config->localJwtSecret === null) {
                        return null;
                    }

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    $bearer = new BearerTokenMiddleware(
                        $problemDetails,
                        new LocalBearerTokenVerifier($config->localJwtSecret),
                    );

                    return new AdminBearerTokenMiddleware($bearer);
                },
            );
    }
}
