<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateChatTables extends AbstractMigration
{
    public function change(): void
    {
        $this->table('chat_sessions')
            ->addColumn('public_token', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['public_token'], ['unique' => true, 'name' => 'uniq_chat_sessions_public_token'])
            ->create();

        $this->table('chat_messages')
            ->addColumn('session_id', 'biginteger', ['null' => false, 'signed' => false])
            ->addColumn('role', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('content', 'text', ['null' => false])
            ->addColumn('citations_json', 'text', ['null' => true])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['session_id'], ['name' => 'idx_chat_messages_session_id'])
            ->addForeignKey('session_id', 'chat_sessions', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
