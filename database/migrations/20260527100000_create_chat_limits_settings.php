<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateChatLimitsSettings extends AbstractMigration
{
    public function change(): void
    {
        $this->table('chat_limits_settings')
            ->addColumn('max_message_chars', 'integer', ['null' => false, 'default' => 800])
            ->addColumn('message_interval_seconds', 'integer', ['null' => false, 'default' => 10])
            ->addColumn('session_requests_per_hour', 'integer', ['null' => false, 'default' => 20])
            ->addColumn('ip_requests_per_hour', 'integer', ['null' => false, 'default' => 60])
            ->addColumn('daily_requests_per_ip', 'integer', ['null' => false, 'default' => 200])
            ->addColumn('daily_requests_global', 'integer', ['null' => false, 'default' => 2000])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->create();
    }
}
