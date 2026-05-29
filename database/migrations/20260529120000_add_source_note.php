<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSourceNote extends AbstractMigration
{
    public function change(): void
    {
        $this->table('sources')
            ->addColumn('note', 'text', ['null' => true])
            ->update();
    }
}
