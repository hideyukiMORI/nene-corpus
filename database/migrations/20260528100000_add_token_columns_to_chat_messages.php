<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddTokenColumnsToChatMessages extends AbstractMigration
{
    public function change(): void
    {
        $this->table('chat_messages')
            ->addColumn('input_tokens', 'integer', ['null' => true, 'default' => null, 'after' => 'citations_json'])
            ->addColumn('output_tokens', 'integer', ['null' => true, 'default' => null, 'after' => 'input_tokens'])
            ->update();
    }
}
