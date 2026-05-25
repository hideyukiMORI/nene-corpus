<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

final readonly class RunInstallUseCase
{
    public function __construct(
        private InstallLock $installLock,
        private DatabaseConnectionTester $databaseTester,
        private EnvFileWriter $envFileWriter,
        private MigrationRunner $migrationRunner,
        private InstallAdminUserCreator $adminUserCreator,
    ) {
    }

    /**
     * @return array{admin_email: string, base_path: string}
     */
    public function execute(RunInstallInput $input): array
    {
        if ($this->installLock->isInstalled()) {
            throw new InstallAlreadyCompletedException('NeNe Corpus is already installed.');
        }

        $this->databaseTester->test($input->database);

        $this->envFileWriter->write([
            'APP_ENV' => 'production',
            'APP_DEBUG' => 'false',
            'DB_ENV' => $input->database->environment,
            'DB_ADAPTER' => $input->database->adapter,
            'DB_HOST' => $input->database->host,
            'DB_PORT' => (string) $input->database->port,
            'DB_NAME' => $input->database->adapter === 'sqlite'
                ? $input->database->sqliteStoragePath()
                : $input->database->name,
            'DB_USER' => $input->database->user,
            'DB_PASSWORD' => $input->database->password,
            'DB_CHARSET' => $input->database->charset,
            'NENE2_LOCAL_JWT_SECRET' => $input->jwtSecret,
            'NENE_CORPUS_BASE_PATH' => $input->basePath,
            'ANTHROPIC_API_KEY' => $input->anthropicApiKey ?? '',
        ]);

        $this->migrationRunner->migrate($input->database);

        $this->adminUserCreator->create(
            $input->database,
            $input->adminEmail,
            password_hash($input->adminPassword, PASSWORD_ARGON2ID),
        );

        $this->installLock->markInstalled();

        return [
            'admin_email' => $input->adminEmail,
            'base_path' => $input->basePath,
        ];
    }
}
