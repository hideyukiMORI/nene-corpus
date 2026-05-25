<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSourceIngestionConfig extends AbstractMigration
{
    public function change(): void
    {
        $this->table('sources')
            ->addColumn('ingestion_config_json', 'text', ['null' => true])
            ->update();
    }
}
