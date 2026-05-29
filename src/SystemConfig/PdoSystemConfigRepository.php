<?php

declare(strict_types=1);

namespace NeneCorpus\SystemConfig;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoSystemConfigRepository implements SystemConfigRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function get(string $key): ?string
    {
        $row = $this->query->fetchOne(
            'SELECT `value` FROM system_config WHERE `key` = ?',
            [$key],
        );

        return $row !== null ? (string) $row['value'] : null;
    }

    public function set(string $key, string $value): void
    {
        $now = date('Y-m-d H:i:s');

        // Use REPLACE INTO for broad DB compatibility (MySQL and SQLite both support it).
        // MySQL: REPLACE = DELETE + INSERT on PK conflict.
        // SQLite: REPLACE = INSERT OR REPLACE.
        $this->query->execute(
            'REPLACE INTO system_config (`key`, `value`, `updated_at`) VALUES (?, ?, ?)',
            [$key, $value, $now],
        );
    }

    /** @return array<string, string> */
    public function all(): array
    {
        $rows = $this->query->fetchAll(
            'SELECT `key`, `value` FROM system_config ORDER BY `key` ASC',
            [],
        );

        $result = [];

        foreach ($rows as $row) {
            $result[(string) $row['key']] = (string) $row['value'];
        }

        return $result;
    }
}
