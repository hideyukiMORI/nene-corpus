<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSessionMetadataToChatSessions extends AbstractMigration
{
    public function change(): void
    {
        $this->table('chat_sessions')
            ->addColumn('client_ip', 'string', ['limit' => 45, 'null' => true, 'after' => 'public_token'])
            ->addColumn('user_agent', 'text', ['null' => true, 'after' => 'client_ip'])
            ->addColumn('referer', 'text', ['null' => true, 'after' => 'user_agent'])
            ->update();
    }
}
