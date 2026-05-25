<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddChatJsonToAppearanceSettings extends AbstractMigration
{
    public function change(): void
    {
        $this->table('appearance_settings')
            ->addColumn('chat_json', 'text', ['null' => true, 'after' => 'hero_json'])
            ->update();
    }
}
