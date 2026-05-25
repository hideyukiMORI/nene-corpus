<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddHeroJsonToAppearanceSettings extends AbstractMigration
{
    public function change(): void
    {
        $this->table('appearance_settings')
            ->addColumn('hero_json', 'text', ['null' => true, 'after' => 'theme_json'])
            ->update();
    }
}
