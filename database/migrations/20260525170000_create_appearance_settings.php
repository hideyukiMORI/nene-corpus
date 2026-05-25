<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateAppearanceSettings extends AbstractMigration
{
    public function change(): void
    {
        $this->table('appearance_settings')
            ->addColumn('widget_locale', 'string', ['limit' => 16, 'null' => true])
            ->addColumn('theme_json', 'text', ['null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->create();
    }
}
