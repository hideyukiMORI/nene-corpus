<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Organization;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Organization\Organization;
use NeneCorpus\Organization\OrganizationNotFoundException;
use NeneCorpus\Organization\OrganizationSlugConflictException;
use NeneCorpus\Organization\PdoOrganizationRepository;
use NeneCorpus\Tests\Support\FixedClock;
use NeneCorpus\Tests\Support\TenancySchemaSetup;
use PHPUnit\Framework\TestCase;

final class PdoOrganizationRepositoryTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private PdoOrganizationRepository $repository;

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

        TenancySchemaSetup::createOrganizations($this->executor);
        TenancySchemaSetup::seedDefaultOrganization($this->executor);

        $this->repository = new PdoOrganizationRepository($this->executor, new FixedClock());
    }

    public function test_findById_returns_organization(): void
    {
        $org = $this->repository->findById(1);

        self::assertNotNull($org);
        self::assertSame(1, $org->id);
        self::assertSame('Default Organization', $org->name);
        self::assertSame('default', $org->slug);
        self::assertTrue($org->isActive);
    }

    public function test_findById_returns_null_for_unknown_id(): void
    {
        $org = $this->repository->findById(999);

        self::assertNull($org);
    }

    public function test_findBySlug_returns_organization(): void
    {
        $org = $this->repository->findBySlug('default');

        self::assertNotNull($org);
        self::assertSame('default', $org->slug);
    }

    public function test_findBySlug_returns_null_for_unknown_slug(): void
    {
        $org = $this->repository->findBySlug('unknown');

        self::assertNull($org);
    }

    public function test_findByCustomDomain_returns_null_when_no_match(): void
    {
        $org = $this->repository->findByCustomDomain('example.com');

        self::assertNull($org);
    }

    public function test_listAll_returns_all_organizations(): void
    {
        $orgs = $this->repository->listAll();

        self::assertCount(1, $orgs);
        self::assertSame('default', $orgs[0]->slug);
    }

    public function test_save_creates_new_organization_and_returns_id(): void
    {
        $org = new Organization(
            name: 'Test Org',
            slug: 'test-org',
            plan: 'free',
            isActive: true,
        );

        $id = $this->repository->save($org);

        self::assertGreaterThan(0, $id);

        $found = $this->repository->findById($id);
        self::assertNotNull($found);
        self::assertSame('test-org', $found->slug);
        self::assertSame('Test Org', $found->name);
    }

    public function test_save_throws_on_duplicate_slug(): void
    {
        $org = new Organization(
            name: 'Duplicate',
            slug: 'default',
            plan: 'free',
            isActive: true,
        );

        $this->expectException(OrganizationSlugConflictException::class);
        $this->repository->save($org);
    }

    public function test_update_modifies_organization(): void
    {
        $org = new Organization(
            name: 'Updated Name',
            slug: 'default',
            plan: 'pro',
            isActive: true,
            id: 1,
        );

        $this->repository->update($org);

        $found = $this->repository->findById(1);
        self::assertNotNull($found);
        self::assertSame('Updated Name', $found->name);
        self::assertSame('pro', $found->plan);
    }

    public function test_delete_removes_organization(): void
    {
        $newOrg = new Organization(
            name: 'To Delete',
            slug: 'to-delete',
            plan: 'free',
            isActive: true,
        );

        $id = $this->repository->save($newOrg);
        $this->repository->delete($id);

        $found = $this->repository->findById($id);
        self::assertNull($found);
    }

    public function test_delete_throws_for_unknown_id(): void
    {
        $this->expectException(OrganizationNotFoundException::class);
        $this->repository->delete(999);
    }
}
