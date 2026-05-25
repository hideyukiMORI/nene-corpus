<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

final readonly class InstallDatabaseConfig
{
    public function __construct(
        public string $adapter,
        public string $host,
        public int $port,
        public string $name,
        public string $user,
        public string $password,
        public string $charset,
        public string $environment,
    ) {
    }

    public function dsn(): string
    {
        return match ($this->adapter) {
            'mysql' => sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $this->host,
                $this->port,
                $this->name,
                $this->charset,
            ),
            'sqlite' => 'sqlite:' . $this->sqliteStoragePath(),
            default => throw new InstallRuntimeException('Unsupported database adapter: ' . $this->adapter),
        };
    }

    public function sqliteStoragePath(): string
    {
        if ($this->adapter !== 'sqlite') {
            throw new InstallRuntimeException('SQLite path requested for non-sqlite adapter.');
        }

        if (str_ends_with($this->name, '.sqlite3')) {
            return $this->name;
        }

        if (str_ends_with($this->name, '.sqlite')) {
            return $this->name . '.sqlite3';
        }

        return $this->name . '.sqlite3';
    }

    public function phinxSqliteName(): string
    {
        return $this->name;
    }
}
