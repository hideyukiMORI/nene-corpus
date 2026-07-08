<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Install\EnvironmentWriter;
use NeneCorpus\Http\BasePathMiddleware;
use NeneCorpus\Http\RuntimeServiceProvider;
use Psr\Container\ContainerInterface;

final readonly class InstallServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.install';

    public const BASE_PATH_MIDDLEWARE = 'nene-corpus.middleware.base_path';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                InstallPathResolver::class,
                static function (ContainerInterface $container): InstallPathResolver {
                    $projectRoot = $container->get(RuntimeServiceProvider::PROJECT_ROOT);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    return new InstallPathResolver($projectRoot);
                },
            )
            ->set(
                InstallLock::class,
                static function (ContainerInterface $container): InstallLock {
                    $projectRoot = $container->get(RuntimeServiceProvider::PROJECT_ROOT);
                    $clock = $container->get(ClockInterface::class);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    return new InstallLock($projectRoot, $clock);
                },
            )
            ->set(
                EnvFileWriter::class,
                static function (ContainerInterface $container): EnvFileWriter {
                    $projectRoot = $container->get(RuntimeServiceProvider::PROJECT_ROOT);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    return new EnvFileWriter($projectRoot, new EnvironmentWriter());
                },
            )
            ->set(
                MigrationRunner::class,
                static function (ContainerInterface $container): MigrationRunner {
                    $projectRoot = $container->get(RuntimeServiceProvider::PROJECT_ROOT);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    return new MigrationRunner($projectRoot);
                },
            )
            ->set(DatabaseConnectionTester::class, static fn (): DatabaseConnectionTester => new DatabaseConnectionTester())
            ->set(
                InstallAdminUserCreator::class,
                static function (ContainerInterface $container): InstallAdminUserCreator {
                    $clock = $container->get(ClockInterface::class);

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    return new InstallAdminUserCreator($clock);
                },
            )
            ->set(
                GetInstallStatusUseCase::class,
                static function (ContainerInterface $container): GetInstallStatusUseCase {
                    $lock = $container->get(InstallLock::class);
                    $paths = $container->get(InstallPathResolver::class);

                    if (!$lock instanceof InstallLock) {
                        throw new LogicException('Install lock service is invalid.');
                    }

                    if (!$paths instanceof InstallPathResolver) {
                        throw new LogicException('Install path resolver service is invalid.');
                    }

                    return new GetInstallStatusUseCase($lock, $paths);
                },
            )
            ->set(
                RunInstallUseCase::class,
                static function (ContainerInterface $container): RunInstallUseCase {
                    $lock = $container->get(InstallLock::class);
                    $tester = $container->get(DatabaseConnectionTester::class);
                    $envWriter = $container->get(EnvFileWriter::class);
                    $migrations = $container->get(MigrationRunner::class);
                    $adminCreator = $container->get(InstallAdminUserCreator::class);

                    if (!$lock instanceof InstallLock) {
                        throw new LogicException('Install lock service is invalid.');
                    }

                    if (!$tester instanceof DatabaseConnectionTester) {
                        throw new LogicException('Database connection tester service is invalid.');
                    }

                    if (!$envWriter instanceof EnvFileWriter) {
                        throw new LogicException('Env file writer service is invalid.');
                    }

                    if (!$migrations instanceof MigrationRunner) {
                        throw new LogicException('Migration runner service is invalid.');
                    }

                    if (!$adminCreator instanceof InstallAdminUserCreator) {
                        throw new LogicException('Install admin user creator service is invalid.');
                    }

                    return new RunInstallUseCase($lock, $tester, $envWriter, $migrations, $adminCreator);
                },
            )
            ->set(
                GetInstallStatusHandler::class,
                static function (ContainerInterface $container): GetInstallStatusHandler {
                    $useCase = $container->get(GetInstallStatusUseCase::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetInstallStatusUseCase) {
                        throw new LogicException('Get install status use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetInstallStatusHandler($useCase, $response);
                },
            )
            ->set(
                RunInstallHandler::class,
                static function (ContainerInterface $container): RunInstallHandler {
                    $useCase = $container->get(RunInstallUseCase::class);
                    $paths = $container->get(InstallPathResolver::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof RunInstallUseCase) {
                        throw new LogicException('Run install use case service is invalid.');
                    }

                    if (!$paths instanceof InstallPathResolver) {
                        throw new LogicException('Install path resolver service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new RunInstallHandler($useCase, $paths, $response);
                },
            )
            ->set(
                InstallAlreadyCompletedExceptionHandler::class,
                static function (ContainerInterface $container): InstallAlreadyCompletedExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new InstallAlreadyCompletedExceptionHandler($problemDetails);
                },
            )
            ->set(
                InstallRuntimeExceptionHandler::class,
                static function (ContainerInterface $container): InstallRuntimeExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new InstallRuntimeExceptionHandler($problemDetails);
                },
            )
            ->set(
                self::BASE_PATH_MIDDLEWARE,
                static function (ContainerInterface $container): BasePathMiddleware {
                    $paths = $container->get(InstallPathResolver::class);

                    if (!$paths instanceof InstallPathResolver) {
                        throw new LogicException('Install path resolver service is invalid.');
                    }

                    return new BasePathMiddleware($paths);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): InstallRouteRegistrar {
                    $getStatus = $container->get(GetInstallStatusHandler::class);
                    $runInstall = $container->get(RunInstallHandler::class);

                    if (!$getStatus instanceof GetInstallStatusHandler) {
                        throw new LogicException('Get install status handler service is invalid.');
                    }

                    if (!$runInstall instanceof RunInstallHandler) {
                        throw new LogicException('Run install handler service is invalid.');
                    }

                    return new InstallRouteRegistrar($getStatus, $runInstall);
                },
            );
    }
}
