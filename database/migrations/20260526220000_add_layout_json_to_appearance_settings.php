<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddLayoutJsonToAppearanceSettings extends AbstractMigration
{
    public function change(): void
    {
        $this->table('appearance_settings')
            ->addColumn('layout_json', 'text', ['null' => true, 'after' => 'chat_json'])
            ->update();
    }
}
