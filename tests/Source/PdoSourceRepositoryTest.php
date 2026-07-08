<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Source;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

final class PdoSourceRepositoryTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private RequestScopedOrgIdHolder $orgIdHolder;

    protected function setUp(): void
    {
        $this->executor = new PdoDatabaseQueryExecutor(new PdoConnectionFactory(new DatabaseConfig(
            null,
            'test',
            'sqlite',
            'localhost',
            1,
            ':memory:',
            'nene_corpus',
            '',
            'utf8',
        )));

        CorpusSchemaSetup::create($this->executor);

        $this->orgIdHolder = new RequestScopedOrgIdHolder();
        $this->orgIdHolder->setId(1);
    }

    public function test_save_returns_new_id(): void
    {
        $repository = new PdoSourceRepository($this->executor, $this->orgIdHolder, new FixedClock());
        $id = $repository->save(new Source(
            name: 'Manual PDF',
            sourceType: SourceType::Pdf,
            status: SourceStatus::Pending,
            storagePath: 'storage/uploads/manual.pdf',
            originalFilename: 'manual.pdf',
            mimeType: 'application/pdf',
            byteSize: 1024,
        ));

        self::assertSame(1, $id);
    }

    public function test_find_by_id_returns_source_when_present(): void
    {
        $repository = new PdoSourceRepository($this->executor, $this->orgIdHolder, new FixedClock());
        $id = $repository->save(new Source(
            name: 'Catalog CSV',
            sourceType: SourceType::Csv,
            status: SourceStatus::Ready,
            storagePath: 'storage/uploads/catalog.csv',
        ));

        $source = $repository->findById($id);

        self::assertNotNull($source);
        self::assertSame('Catalog CSV', $source->name);
        self::assertSame(SourceType::Csv, $source->sourceType);
        self::assertSame(SourceStatus::Ready, $source->status);
    }

    public function test_find_by_id_returns_null_when_source_is_absent(): void
    {
        $repository = new PdoSourceRepository($this->executor, $this->orgIdHolder, new FixedClock());

        self::assertNull($repository->findById(99));
    }

    public function test_soft_delete_excludes_source_from_find_by_id(): void
    {
        $repository = new PdoSourceRepository($this->executor, $this->orgIdHolder, new FixedClock());
        $id = $repository->save(new Source(
            name: 'To delete',
            sourceType: SourceType::Pdf,
            status: SourceStatus::Pending,
            storagePath: 'storage/uploads/delete-me.pdf',
        ));

        $repository->softDelete($id, '2026-05-25 12:00:00');

        self::assertNull($repository->findById($id));
    }

    public function test_find_all_respects_limit_and_offset(): void
    {
        $repository = new PdoSourceRepository($this->executor, $this->orgIdHolder, new FixedClock());

        for ($i = 1; $i <= 3; $i++) {
            $repository->save(new Source(
                name: "Source {$i}",
                sourceType: SourceType::Pdf,
                status: SourceStatus::Pending,
                storagePath: "storage/uploads/source-{$i}.pdf",
            ));
        }

        $sources = $repository->findAll(1, 1);

        self::assertCount(1, $sources);
        self::assertSame('Source 2', $sources[0]->name);
    }

    public function test_org_isolation_prevents_cross_org_access(): void
    {
        $org1Holder = new RequestScopedOrgIdHolder();
        $org1Holder->setId(1);

        $org2Holder = new RequestScopedOrgIdHolder();
        $org2Holder->setId(2);

        $repoOrg1 = new PdoSourceRepository($this->executor, $org1Holder, new FixedClock());
        $repoOrg2 = new PdoSourceRepository($this->executor, $org2Holder, new FixedClock());

        $idOrg1 = $repoOrg1->save(new Source(
            name: 'Org 1 Source',
            sourceType: SourceType::Pdf,
            status: SourceStatus::Pending,
            storagePath: 'storage/uploads/org1.pdf',
        ));

        // Org 2 cannot see Org 1's source
        self::assertNull($repoOrg2->findById($idOrg1));

        // Org 1 can still see its own source
        self::assertNotNull($repoOrg1->findById($idOrg1));

        // Org 2 sees empty list
        self::assertSame([], $repoOrg2->findAll(10, 0));
        self::assertSame(0, $repoOrg2->countAll());
    }
}
