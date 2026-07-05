<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use LogicException;
use Nene2\Auth\BearerTokenMiddleware;
use Nene2\Auth\LocalBearerTokenVerifier;
use Nene2\Auth\TokenIssuerInterface;
use Nene2\Config\AppConfig;
use Nene2\Config\AppEnvironment;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneCorpus\Mail\MailerInterface;
use Psr\Container\ContainerInterface;

final readonly class AdminAuthServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.admin_auth';

    public const AUTH_MIDDLEWARE = 'nene-corpus.middleware.admin_auth';

    public const LOGIN_RATE_LIMIT_MIDDLEWARE = 'nene-corpus.middleware.admin_login_rate_limit';

    public const SUPERADMIN_MIDDLEWARE = 'nene-corpus.middleware.superadmin';

    public const TOKEN_ISSUER = 'nene-corpus.admin_auth.token_issuer';

    /**
     * Dev/test-only fallback secret. Never reaches production: there
     * {@see self::resolveJwtSecret()} fails closed instead. This value is
     * publicly known, so it must never sign or verify real tokens.
     */
    private const DEFAULT_DEV_SECRET = 'nene-corpus-dev-secret';

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

                    // PdoAdminUserRepository does not scope findByEmail/findById by org
                    // (those methods are called from bypass-path use cases: login, password-reset).
                    // listByOrganization and create do use the org argument explicitly.
                    return new PdoAdminUserRepository($query);
                },
            )
            ->set(
                self::TOKEN_ISSUER,
                static function (ContainerInterface $container): TokenIssuerInterface {
                    $config = $container->get(AppConfig::class);

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    // Always build a verifier: the secret is resolved fail-closed
                    // (production without a secret refuses to boot), so admin auth
                    // is never silently disabled.
                    return new LocalBearerTokenVerifier(self::resolveJwtSecret($config));
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
                AdminPasswordResetRepositoryInterface::class,
                static function (ContainerInterface $container): AdminPasswordResetRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoAdminPasswordResetRepository($query);
                },
            )
            ->set(
                RequestPasswordResetUseCaseInterface::class,
                static function (ContainerInterface $container): RequestPasswordResetUseCaseInterface {
                    $users  = $container->get(AdminUserRepositoryInterface::class);
                    $resets = $container->get(AdminPasswordResetRepositoryInterface::class);
                    $mailer = $container->get(MailerInterface::class);

                    if (!$users instanceof AdminUserRepositoryInterface) {
                        throw new LogicException('Admin user repository service is invalid.');
                    }

                    if (!$resets instanceof AdminPasswordResetRepositoryInterface) {
                        throw new LogicException('Admin password reset repository service is invalid.');
                    }

                    if (!$mailer instanceof MailerInterface) {
                        throw new LogicException('Mailer service is invalid.');
                    }

                    return new RequestPasswordResetUseCase($users, $resets, $mailer);
                },
            )
            ->set(
                ConfirmPasswordResetUseCaseInterface::class,
                static function (ContainerInterface $container): ConfirmPasswordResetUseCaseInterface {
                    $resets = $container->get(AdminPasswordResetRepositoryInterface::class);
                    $users  = $container->get(AdminUserRepositoryInterface::class);

                    if (!$resets instanceof AdminPasswordResetRepositoryInterface) {
                        throw new LogicException('Admin password reset repository service is invalid.');
                    }

                    if (!$users instanceof AdminUserRepositoryInterface) {
                        throw new LogicException('Admin user repository service is invalid.');
                    }

                    return new ConfirmPasswordResetUseCase($resets, $users);
                },
            )
            ->set(
                RequestPasswordResetHandler::class,
                static function (ContainerInterface $container): RequestPasswordResetHandler {
                    $useCase  = $container->get(RequestPasswordResetUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof RequestPasswordResetUseCaseInterface) {
                        throw new LogicException('Request password reset use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new RequestPasswordResetHandler($useCase, $response);
                },
            )
            ->set(
                ConfirmPasswordResetHandler::class,
                static function (ContainerInterface $container): ConfirmPasswordResetHandler {
                    $useCase  = $container->get(ConfirmPasswordResetUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof ConfirmPasswordResetUseCaseInterface) {
                        throw new LogicException('Confirm password reset use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ConfirmPasswordResetHandler($useCase, $response);
                },
            )
            ->set(
                InvalidPasswordResetTokenExceptionHandler::class,
                static function (ContainerInterface $container): InvalidPasswordResetTokenExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new InvalidPasswordResetTokenExceptionHandler($problemDetails);
                },
            )
            ->set(
                self::LOGIN_RATE_LIMIT_MIDDLEWARE,
                static function (ContainerInterface $container): AdminLoginRateLimitMiddleware {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    $storage        = $container->get(RateLimitStorageInterface::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    if (!$storage instanceof RateLimitStorageInterface) {
                        throw new LogicException('Rate limit storage service is invalid.');
                    }

                    return new AdminLoginRateLimitMiddleware($problemDetails, $storage);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): AdminAuthRouteRegistrar {
                    $login          = $container->get(LoginAdminHandler::class);
                    $me             = $container->get(GetAdminMeHandler::class);
                    $changePassword = $container->get(ChangeAdminPasswordHandler::class);
                    $changeEmail    = $container->get(ChangeAdminEmailHandler::class);
                    $requestReset   = $container->get(RequestPasswordResetHandler::class);
                    $confirmReset   = $container->get(ConfirmPasswordResetHandler::class);

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

                    if (!$requestReset instanceof RequestPasswordResetHandler) {
                        throw new LogicException('Request password reset handler service is invalid.');
                    }

                    if (!$confirmReset instanceof ConfirmPasswordResetHandler) {
                        throw new LogicException('Confirm password reset handler service is invalid.');
                    }

                    return new AdminAuthRouteRegistrar($login, $me, $changePassword, $changeEmail, $requestReset, $confirmReset);
                },
            )
            ->set(
                self::SUPERADMIN_MIDDLEWARE,
                static function (ContainerInterface $container): SuperadminMiddleware {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new SuperadminMiddleware($problemDetails);
                },
            )
            ->set(
                self::AUTH_MIDDLEWARE,
                static function (ContainerInterface $container): AdminBearerTokenMiddleware {
                    $config = $container->get(AppConfig::class);
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    // Always build the auth middleware so it is unconditionally part
                    // of the chain; resolveJwtSecret() fails closed in production.
                    $bearer = new BearerTokenMiddleware(
                        $problemDetails,
                        new LocalBearerTokenVerifier(self::resolveJwtSecret($config)),
                    );

                    return new AdminBearerTokenMiddleware($bearer);
                },
            );
    }

    /**
     * Resolves the HMAC secret for local admin bearer tokens, failing closed.
     *
     * The same secret signs and verifies admin bearer tokens, so a predictable
     * value is a full authentication bypass (a forged superadmin token). In
     * production the secret is therefore mandatory: if NENE2_LOCAL_JWT_SECRET is
     * unset (or empty) we refuse to boot rather than silently fall back to the
     * public dev constant. Local/test may use the dev fallback for convenience.
     */
    private static function resolveJwtSecret(AppConfig $config): string
    {
        if ($config->localJwtSecret !== null && $config->localJwtSecret !== '') {
            return $config->localJwtSecret;
        }

        if ($config->environment === AppEnvironment::Production) {
            throw new LogicException(
                'NENE2_LOCAL_JWT_SECRET must be set in production. '
                . 'Generate one with: php -r "echo bin2hex(random_bytes(32));"',
            );
        }

        return self::DEFAULT_DEV_SECRET;
    }
}
