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
 *
 * すべて Phinx schema builder API を使い MySQL / SQLite 両対応。
 */
final class CreateTenancyTablesAndOrgIdColumns extends AbstractMigration
{
    public function up(): void
    {
        $now = date('Y-m-d H:i:s');

        // 1. organizations テーブル作成
        if (!$this->hasTable('organizations')) {
            $this->table('organizations')
                ->addColumn('name', 'string', ['limit' => 255, 'null' => false])
                ->addColumn('slug', 'string', ['limit' => 100, 'null' => false])
                ->addColumn('custom_domain', 'string', ['limit' => 255, 'null' => true, 'default' => null])
                ->addColumn('plan', 'string', ['limit' => 32, 'null' => false, 'default' => 'free'])
                ->addColumn('is_active', 'boolean', ['null' => false, 'default' => true])
                ->addColumn('external_id', 'string', ['limit' => 255, 'null' => true, 'default' => null])
                ->addColumn('created_at', 'datetime', ['null' => false])
                ->addColumn('updated_at', 'datetime', ['null' => false])
                ->addIndex(['slug'], ['unique' => true, 'name' => 'uq_organizations_slug'])
                ->addIndex(['custom_domain'], ['unique' => true, 'name' => 'uq_organizations_custom_domain'])
                ->addIndex(['external_id'], ['unique' => true, 'name' => 'uq_organizations_external_id'])
                ->create();
        }

        // 2. system_config テーブル作成（PK は key、AUTO_INCREMENT 不要）
        if (!$this->hasTable('system_config')) {
            $this->table('system_config', ['id' => false, 'primary_key' => ['key']])
                ->addColumn('key', 'string', ['limit' => 191, 'null' => false])
                ->addColumn('value', 'string', ['limit' => 1024, 'null' => false, 'default' => ''])
                ->addColumn('updated_at', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
                ->create();
        }

        // 3. Default Organization の seed (id=1)
        $orgRow = $this->fetchRow('SELECT id FROM organizations WHERE id = 1');
        if ($orgRow === false || $orgRow === null) {
            $this->table('organizations')->insert([
                'id' => 1,
                'name' => 'Default Organization',
                'slug' => 'default',
                'plan' => 'free',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ])->saveData();
        }

        // 4. system_config 初期値 seed
        $defaults = [
            ['key' => 'tenant_resolution_mode', 'value' => 'single'],
            ['key' => 'tenant_org_slug', 'value' => 'default'],
            ['key' => 'tenant_base_domain', 'value' => 'localhost'],
        ];
        foreach ($defaults as $row) {
            $key = $row['key'];
            $existing = $this->fetchRow("SELECT `value` FROM system_config WHERE `key` = '{$key}'");
            if ($existing === false || $existing === null) {
                $this->table('system_config')->insert([
                    'key' => $row['key'],
                    'value' => $row['value'],
                    'updated_at' => $now,
                ])->saveData();
            }
        }

        // 5. 既存テーブルに organization_id カラム追加
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

        foreach ($tables as $tableName) {
            if (!$this->hasTable($tableName)) {
                continue;
            }
            $table = $this->table($tableName);
            if (!$table->hasColumn('organization_id')) {
                $table
                    ->addColumn('organization_id', 'integer', ['null' => false, 'default' => 1])
                    ->addIndex(['organization_id'], ['name' => "idx_{$tableName}_org_id"])
                    ->update();
            }
        }

        // 6. admin_users に role カラム追加
        if ($this->hasTable('admin_users')) {
            $adminUsers = $this->table('admin_users');
            if (!$adminUsers->hasColumn('role')) {
                $adminUsers->addColumn('role', 'string', ['limit' => 32, 'null' => false, 'default' => 'admin'])->update();
            }
        }

        // 7. 既存の最初の admin_user を superadmin に昇格、organization_id を 0（= グローバル）に
        //    Tier A 自動アップグレード経路: 最初の admin が全テナントを管理
        if ($this->hasTable('admin_users')) {
            $firstAdmin = $this->fetchRow('SELECT id FROM admin_users ORDER BY id ASC LIMIT 1');
            if (is_array($firstAdmin) && isset($firstAdmin['id'])) {
                $id = (int) $firstAdmin['id'];
                $this->execute("UPDATE admin_users SET role = 'superadmin', organization_id = 0 WHERE id = {$id}");
            }
        }

        // 8. rate_limit_buckets の UNIQUE 制約を compound (organization_id, bucket_key) に
        //    org スコープ化されたので bucket_key だけでは衝突する。
        if ($this->hasTable('rate_limit_buckets')) {
            $rateBuckets = $this->table('rate_limit_buckets');
            if ($rateBuckets->hasIndexByName('uniq_rate_limit_buckets_bucket_key')) {
                $rateBuckets->removeIndexByName('uniq_rate_limit_buckets_bucket_key')->update();
            }
            if (!$rateBuckets->hasIndexByName('uniq_rate_limit_buckets_org_bucket_key')) {
                $rateBuckets
                    ->addIndex(['organization_id', 'bucket_key'], [
                        'unique' => true,
                        'name' => 'uniq_rate_limit_buckets_org_bucket_key',
                    ])
                    ->update();
            }
        }
    }

    public function down(): void
    {
        // admin_users: superadmin を admin に戻す
        if ($this->hasTable('admin_users')) {
            $adminUsers = $this->table('admin_users');
            if ($adminUsers->hasColumn('role')) {
                $this->execute("UPDATE admin_users SET role = 'admin', organization_id = 1 WHERE role = 'superadmin'");
                $adminUsers->removeColumn('role')->update();
            }
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

        foreach ($tables as $tableName) {
            if (!$this->hasTable($tableName)) {
                continue;
            }
            $table = $this->table($tableName);
            if ($table->hasColumn('organization_id')) {
                $table->removeIndexByName("idx_{$tableName}_org_id")->removeColumn('organization_id')->update();
            }
        }

        // system_config テーブル削除
        if ($this->hasTable('system_config')) {
            $this->table('system_config')->drop()->update();
        }

        // organizations テーブル削除
        if ($this->hasTable('organizations')) {
            $this->table('organizations')->drop()->update();
        }
    }
}
