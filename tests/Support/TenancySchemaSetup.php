<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use Nene2\Database\PdoDatabaseQueryExecutor;

final class TenancySchemaSetup
{
    public static function createOrganizations(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE organizations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    slug TEXT NOT NULL,
                    custom_domain TEXT NULL,
                    plan TEXT NOT NULL DEFAULT 'free',
                    is_active INTEGER NOT NULL DEFAULT 1,
                    external_id TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                SQL,
        );

        $executor->execute('CREATE UNIQUE INDEX uq_organizations_slug ON organizations (slug)');
        $executor->execute('CREATE UNIQUE INDEX uq_organizations_custom_domain ON organizations (custom_domain)');
        $executor->execute('CREATE UNIQUE INDEX uq_organizations_external_id ON organizations (external_id)');
    }

    public static function createSystemConfig(PdoDatabaseQueryExecutor $executor): void
    {
        $executor->execute(
            <<<'SQL'
                CREATE TABLE system_config (
                    `key` TEXT NOT NULL,
                    `value` TEXT NOT NULL DEFAULT '',
                    `updated_at` TEXT NOT NULL,
                    PRIMARY KEY (`key`)
                )
                SQL,
        );
    }

    public static function seedDefaultOrganization(PdoDatabaseQueryExecutor $executor): void
    {
        $now = gmdate('Y-m-d H:i:s');
        $executor->execute(
            "INSERT INTO organizations (id, name, slug, plan, is_active, created_at, updated_at)
             VALUES (1, 'Default Organization', 'default', 'free', 1, ?, ?)",
            [$now, $now],
        );
    }

    public static function seedSystemConfig(PdoDatabaseQueryExecutor $executor): void
    {
        $now = gmdate('Y-m-d H:i:s');
        $executor->execute(
            "INSERT INTO system_config (`key`, `value`, `updated_at`) VALUES ('tenant_resolution_mode', 'single', ?)",
            [$now],
        );
        $executor->execute(
            "INSERT INTO system_config (`key`, `value`, `updated_at`) VALUES ('tenant_org_slug', 'default', ?)",
            [$now],
        );
        $executor->execute(
            "INSERT INTO system_config (`key`, `value`, `updated_at`) VALUES ('tenant_base_domain', 'localhost', ?)",
            [$now],
        );
    }

    /**
     * Creates all tenancy tables and seeds the default organization and system config.
     * Call this in HTTP test setUp before CorpusSchemaSetup::create().
     */
    public static function createAndSeed(PdoDatabaseQueryExecutor $executor): void
    {
        self::createOrganizations($executor);
        self::createSystemConfig($executor);
        self::seedDefaultOrganization($executor);
        self::seedSystemConfig($executor);
    }
}
