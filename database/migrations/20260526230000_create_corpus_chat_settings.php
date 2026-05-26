<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateCorpusChatSettings extends AbstractMigration
{
    public function change(): void
    {
        $this->table('corpus_chat_settings')
            ->addColumn('system_prompt', 'text', ['null' => true])
            ->addColumn('fallback_message', 'text', ['null' => true])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->create();
    }
}
