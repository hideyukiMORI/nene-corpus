<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateAdminPasswordResets extends AbstractMigration
{
    public function change(): void
    {
        $this->table('admin_password_resets')
            ->addColumn('token_hash', 'string', ['limit' => 64, 'null' => false, 'comment' => 'SHA-256 hex of the raw reset token'])
            ->addColumn('admin_user_id', 'integer', ['null' => false])
            ->addColumn('expires_at', 'datetime', ['null' => false])
            ->addColumn('used_at', 'datetime', ['null' => true, 'default' => null, 'comment' => 'Set when token is consumed'])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addIndex(['token_hash'], ['unique' => true])
            ->addIndex(['admin_user_id'])
            ->create();
    }
}
