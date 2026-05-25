<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateCorpusTables extends AbstractMigration
{
    public function change(): void
    {
        $this->table('sources')
            ->addColumn('name', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('source_type', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('status', 'string', ['limit' => 32, 'null' => false, 'default' => 'pending'])
            ->addColumn('storage_path', 'string', ['limit' => 512, 'null' => false])
            ->addColumn('original_filename', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('mime_type', 'string', ['limit' => 127, 'null' => true])
            ->addColumn('byte_size', 'biginteger', ['null' => true, 'signed' => false])
            ->addColumn('error_message', 'text', ['null' => true])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addColumn('is_deleted', 'boolean', ['null' => false, 'default' => false])
            ->addColumn('deleted_at', 'datetime', ['null' => true])
            ->addIndex(['status'], ['name' => 'idx_sources_status'])
            ->addIndex(['is_deleted'], ['name' => 'idx_sources_is_deleted'])
            ->create();

        $this->table('documents')
            ->addColumn('source_id', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('title', 'string', ['limit' => 512, 'null' => false])
            ->addColumn('position', 'integer', ['null' => false, 'default' => 0])
            ->addColumn('metadata_json', 'text', ['null' => true])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addColumn('is_deleted', 'boolean', ['null' => false, 'default' => false])
            ->addColumn('deleted_at', 'datetime', ['null' => true])
            ->addIndex(['source_id'], ['name' => 'idx_documents_source_id'])
            ->addIndex(['is_deleted'], ['name' => 'idx_documents_is_deleted'])
            ->addForeignKey('source_id', 'sources', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();

        $this->table('chunks')
            ->addColumn('document_id', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('source_id', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('chunk_index', 'integer', ['null' => false, 'default' => 0])
            ->addColumn('content', 'text', ['null' => false])
            ->addColumn('page_number', 'integer', ['null' => true])
            ->addColumn('section_label', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('token_count', 'integer', ['null' => true])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['document_id'], ['name' => 'idx_chunks_document_id'])
            ->addIndex(['source_id'], ['name' => 'idx_chunks_source_id'])
            ->addForeignKey('document_id', 'documents', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('source_id', 'sources', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
