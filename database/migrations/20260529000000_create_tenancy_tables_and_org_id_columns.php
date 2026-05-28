<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * マルチテナント基盤 Phase A — DB スキーマ変更
 *
 * 変更内容:
 *  1. organizations テーブル新設
 *  2. system_config テーブル新設 + 初期 seed
 *  3. 全 12 既存テーブルに organization_id カラム追加（DEFAULT 1 = default org）
 *  4. admin_users に role カラム追加
 *  5. 既存の最初の admin_user を superadmin に昇格
 */
final class CreateTenancyTablesAndOrgIdColumns extends AbstractMigration
{
    public function up(): void
    {
        // 1. organizations テーブル作成
        $this->execute(<<<'SQL'
            CREATE TABLE IF NOT EXISTS organizations (
                id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
                name        VARCHAR(255)  NOT NULL,
                slug        VARCHAR(100)  NOT NULL,
                custom_domain VARCHAR(255) NULL DEFAULT NULL,
                plan        VARCHAR(32)   NOT NULL DEFAULT 'free',
                is_active   TINYINT(1)    NOT NULL DEFAULT 1,
                external_id VARCHAR(255)  NULL DEFAULT NULL,
                created_at  DATETIME      NOT NULL,
                updated_at  DATETIME      NOT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY uq_organizations_slug (slug),
                UNIQUE KEY uq_organizations_custom_domain (custom_domain),
                UNIQUE KEY uq_organizations_external_id (external_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);

        // 2. system_config テーブル作成
        $this->execute(<<<'SQL'
            CREATE TABLE IF NOT EXISTS system_config (
                `key`        VARCHAR(191)  NOT NULL,
                `value`      VARCHAR(1024) NOT NULL DEFAULT '',
                `updated_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`key`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);

        // 3. Default Organization の seed
        $now = date('Y-m-d H:i:s');
        $this->execute(<<<SQL
            INSERT IGNORE INTO organizations (id, name, slug, plan, is_active, created_at, updated_at)
            VALUES (1, 'Default Organization', 'default', 'free', 1, '{$now}', '{$now}')
        SQL);

        // 4. system_config 初期値 seed
        $this->execute(<<<'SQL'
            INSERT IGNORE INTO system_config (`key`, `value`) VALUES
                ('tenant_resolution_mode', 'single'),
                ('tenant_org_slug',        'default'),
                ('tenant_base_domain',     'localhost')
        SQL);

        // 5. 既存テーブルに organization_id カラム追加（べき等: INFORMATION_SCHEMA でチェック）
        $tables = [
            'sources',
            'documents',
            'chunks',
            'chat_sessions',
            'chat_messages',
            'rate_limit_buckets',
            'appearance_settings',
            'corpus_chat_settings',
            'chat_limits_settings',
            'admin_users',
            'admin_password_resets',
        ];

        foreach ($tables as $table) {
            if ($this->hasTable($table) && !$this->columnExists($table, 'organization_id')) {
                $this->execute("
                    ALTER TABLE `{$table}`
                        ADD COLUMN organization_id INT NOT NULL DEFAULT 1,
                        ADD INDEX idx_{$table}_org_id (organization_id)
                ");
            }
        }

        // 6. admin_users に role カラム追加
        if ($this->hasTable('admin_users') && !$this->columnExists('admin_users', 'role')) {
            $this->execute("
                ALTER TABLE admin_users
                    ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'admin'
            ");
        }

        // 7. 既存の最初の admin_user を superadmin に昇格、organization_id を NULL に
        //    （Tier A 自動アップグレード経路: 最初の admin が全テナントを管理）
        if ($this->hasTable('admin_users')) {
            if ($this->columnExists('admin_users', 'role')) {
                $this->execute("
                    UPDATE admin_users
                    SET role = 'superadmin', organization_id = 0
                    ORDER BY id ASC
                    LIMIT 1
                ");
            }
        }
    }

    public function down(): void
    {
        // admin_users: superadmin を admin に戻す（逆順）
        if ($this->hasTable('admin_users') && $this->columnExists('admin_users', 'role')) {
            $this->execute("
                UPDATE admin_users SET role = 'admin', organization_id = 1
                WHERE role = 'superadmin'
            ");
        }

        // admin_users: role カラム削除
        if ($this->hasTable('admin_users') && $this->columnExists('admin_users', 'role')) {
            $this->execute('ALTER TABLE admin_users DROP COLUMN role');
        }

        // 既存テーブルから organization_id 削除
        $tables = [
            'admin_password_resets',
            'admin_users',
            'chat_limits_settings',
            'corpus_chat_settings',
            'appearance_settings',
            'rate_limit_buckets',
            'chat_messages',
            'chat_sessions',
            'chunks',
            'documents',
            'sources',
        ];

        foreach ($tables as $table) {
            if ($this->hasTable($table) && $this->columnExists($table, 'organization_id')) {
                $this->execute("ALTER TABLE `{$table}` DROP COLUMN organization_id");
            }
        }

        // system_config テーブル削除
        $this->execute('DROP TABLE IF EXISTS system_config');

        // organizations テーブル削除
        $this->execute('DROP TABLE IF EXISTS organizations');
    }

    private function columnExists(string $table, string $column): bool
    {
        $row = $this->fetchRow("
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = '{$table}'
              AND COLUMN_NAME = '{$column}'
            LIMIT 1
        ");

        return $row !== false;
    }
}
