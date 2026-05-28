<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\AdminAuth\PdoAdminUserRepository;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use PHPUnit\Framework\TestCase;

/**
 * PdoAdminUserRepository の org スコープ動作を検証する。
 *
 * - listByOrganization($orgId) は該当 org の admin のみ返す
 * - listByOrganization(null) は全 org の admin を返す（superadmin 特例）
 * - create() は指定 org に admin を作成する
 * - findByEmail / findById はバイパスパス用につき org フィルタを持たない
 */
final class PdoAdminUserRepositoryOrgScopeTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;
    private PdoAdminUserRepository $repository;

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

        CorpusSchemaSetup::createAdminUsers($this->executor);
        $this->repository = new PdoAdminUserRepository($this->executor);
    }

    // ── create ────────────────────────────────────────────────────────────────

    public function test_create_assigns_organization_id(): void
    {
        $hash = password_hash('pass', PASSWORD_BCRYPT);
        $user = $this->repository->create('org1admin@example.com', $hash, 'admin', 1);

        self::assertSame(1, $user->organizationId);
        self::assertSame('org1admin@example.com', $user->email);
        self::assertSame('admin', $user->role);
        self::assertNotNull($user->id);
    }

    // ── listByOrganization ────────────────────────────────────────────────────

    public function test_listByOrganization_returns_only_org_admins(): void
    {
        $hash = password_hash('pass', PASSWORD_BCRYPT);
        $this->repository->create('org1a@example.com', $hash, 'admin', 1);
        $this->repository->create('org1b@example.com', $hash, 'admin', 1);
        $this->repository->create('org2a@example.com', $hash, 'admin', 2);

        $org1Users = $this->repository->listByOrganization(1);

        self::assertCount(2, $org1Users);
        $emails = array_map(fn ($u) => $u->email, $org1Users);
        self::assertContains('org1a@example.com', $emails);
        self::assertContains('org1b@example.com', $emails);
    }

    public function test_listByOrganization_null_returns_all_orgs_superadmin_scope(): void
    {
        $hash = password_hash('pass', PASSWORD_BCRYPT);

        // Insert a superadmin (organization_id IS NULL via raw SQL to simulate the migration pattern)
        $now = gmdate('Y-m-d H:i:s');
        $this->executor->execute(
            'INSERT INTO admin_users (email, password_hash, role, organization_id, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)',
            ['super@example.com', $hash, 'superadmin', $now, $now],
        );
        $this->repository->create('org1@example.com', $hash, 'admin', 1);
        $this->repository->create('org2@example.com', $hash, 'admin', 2);

        $all = $this->repository->listByOrganization(null);

        self::assertCount(3, $all);
    }

    public function test_listByOrganization_empty_when_no_admins_in_org(): void
    {
        $hash = password_hash('pass', PASSWORD_BCRYPT);
        $this->repository->create('org1@example.com', $hash, 'admin', 1);

        $org2Users = $this->repository->listByOrganization(2);

        self::assertCount(0, $org2Users);
    }

    // ── データ分離テスト ──────────────────────────────────────────────────────

    public function test_org1_admins_not_visible_in_org2_listing(): void
    {
        $hash = password_hash('pass', PASSWORD_BCRYPT);
        $this->repository->create('only-org1@example.com', $hash, 'admin', 1);

        $org2 = $this->repository->listByOrganization(2);

        self::assertCount(0, $org2);
    }

    // ── findByEmail / findById はグローバル（バイパスパス用） ─────────────────

    public function test_findByEmail_finds_across_orgs(): void
    {
        $hash = password_hash('pass', PASSWORD_BCRYPT);
        $this->repository->create('cross-org@example.com', $hash, 'admin', 2);

        // Even when called with "org 1 context", the global lookup works
        $user = $this->repository->findByEmail('cross-org@example.com');

        self::assertNotNull($user);
        self::assertSame(2, $user->organizationId);
    }
}
