<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateAdminUsersTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('admin_users')
            ->addColumn('email', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('password_hash', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['email'], ['unique' => true, 'name' => 'uniq_admin_users_email'])
            ->create();
    }
}
