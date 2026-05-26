<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddCustomCssToAppearanceSettings extends AbstractMigration
{
    public function change(): void
    {
        $this->table('appearance_settings')
            ->addColumn('custom_css', 'text', ['null' => true, 'after' => 'layout_json'])
            ->update();
    }
}
