<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

use Phinx\Config\Config;
use Phinx\Migration\Manager;
use Symfony\Component\Console\Input\StringInput;
use Symfony\Component\Console\Output\NullOutput;

final readonly class MigrationRunner
{
    public function __construct(
        private string $projectRoot,
    ) {
    }

    public function migrate(InstallDatabaseConfig $database): void
    {
        if ($database->adapter === 'sqlite') {
            $directory = dirname($database->name);

            if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
                throw new InstallRuntimeException('Unable to create SQLite directory.');
            }
        }

        $environment = $database->environment;
        $configArray = [
            'paths' => [
                'migrations' => $this->projectRoot . '/database/migrations',
                'seeds' => $this->projectRoot . '/database/seeds',
            ],
            'environments' => [
                'default_environment' => $environment,
                $environment => $this->environmentConfig($database),
            ],
            'version_order' => 'creation',
        ];

        $manager = new Manager(new Config($configArray), new StringInput(''), new NullOutput());
        $manager->migrate($environment);
    }

    /**
     * @return array<string, mixed>
     */
    private function environmentConfig(InstallDatabaseConfig $database): array
    {
        if ($database->adapter === 'sqlite') {
            return [
                'adapter' => 'sqlite',
                'name' => $database->phinxSqliteName(),
            ];
        }

        return [
            'adapter' => $database->adapter,
            'host' => $database->host,
            'name' => $database->name,
            'user' => $database->user,
            'pass' => $database->password,
            'port' => $database->port,
            'charset' => $database->charset,
        ];
    }
}
