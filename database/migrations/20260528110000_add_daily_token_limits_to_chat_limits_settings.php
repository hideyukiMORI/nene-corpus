<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDailyTokenLimitsToChatLimitsSettings extends AbstractMigration
{
    public function change(): void
    {
        $this->table('chat_limits_settings')
            ->addColumn('daily_tokens_per_ip', 'integer', ['null' => false, 'default' => 0, 'after' => 'daily_requests_global'])
            ->addColumn('daily_tokens_global', 'integer', ['null' => false, 'default' => 0, 'after' => 'daily_tokens_per_ip'])
            ->update();
    }
}
