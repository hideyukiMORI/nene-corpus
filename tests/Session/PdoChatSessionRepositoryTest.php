<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Session;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Session\ChatSession;
use NeneCorpus\Session\PdoChatSessionRepository;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\ChatSchemaSetup;
use PHPUnit\Framework\TestCase;

final class PdoChatSessionRepositoryTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

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

        ChatSchemaSetup::create($this->executor);
    }

    private function makeRepository(int $orgId = 1): PdoChatSessionRepository
    {
        $holder = new RequestScopedOrgIdHolder();
        $holder->setId($orgId);

        return new PdoChatSessionRepository($this->executor, $holder);
    }

    public function test_save_and_find_by_public_token(): void
    {
        $repository = $this->makeRepository();
        $id = $repository->save(new ChatSession(publicToken: 'abc123token'));

        $session = $repository->findByPublicToken('abc123token');

        self::assertNotNull($session);
        self::assertSame($id, $session->id);
        self::assertSame('abc123token', $session->publicToken);
    }

    public function test_find_by_id_returns_saved_session(): void
    {
        $repository = $this->makeRepository();
        $id = $repository->save(new ChatSession(publicToken: 'session-token'));

        $session = $repository->findById($id);

        self::assertNotNull($session);
        self::assertSame('session-token', $session->publicToken);
    }

    public function test_sessions_are_isolated_by_organization(): void
    {
        $repo1 = $this->makeRepository(1);
        $repo2 = $this->makeRepository(2);

        $repo1->save(new ChatSession(publicToken: 'org1-token'));
        $repo2->save(new ChatSession(publicToken: 'org2-token'));

        // org1 cannot see org2 session by public token
        self::assertNull($repo1->findByPublicToken('org2-token'));
        // org2 cannot see org1 session by public token
        self::assertNull($repo2->findByPublicToken('org1-token'));

        // each org sees only its own session
        self::assertNotNull($repo1->findByPublicToken('org1-token'));
        self::assertNotNull($repo2->findByPublicToken('org2-token'));
    }

    public function test_count_all_scoped_to_organization(): void
    {
        $repo1 = $this->makeRepository(1);
        $repo2 = $this->makeRepository(2);

        $repo1->save(new ChatSession(publicToken: 'org1-a'));
        $repo1->save(new ChatSession(publicToken: 'org1-b'));
        $repo2->save(new ChatSession(publicToken: 'org2-a'));

        self::assertSame(2, $repo1->countAll());
        self::assertSame(1, $repo2->countAll());
    }

    public function test_find_all_summaries_scoped_to_organization(): void
    {
        $repo1 = $this->makeRepository(1);
        $repo2 = $this->makeRepository(2);

        $repo1->save(new ChatSession(publicToken: 'org1-summary-token'));
        $repo2->save(new ChatSession(publicToken: 'org2-summary-token'));

        $summaries1 = $repo1->findAllSummaries(10, 0);
        $summaries2 = $repo2->findAllSummaries(10, 0);

        self::assertCount(1, $summaries1);
        self::assertSame('org1-summary-token', $summaries1[0]->session->publicToken);

        self::assertCount(1, $summaries2);
        self::assertSame('org2-summary-token', $summaries2[0]->session->publicToken);
    }

    public function test_find_by_id_does_not_cross_organization_boundary(): void
    {
        $repo1 = $this->makeRepository(1);
        $repo2 = $this->makeRepository(2);

        $id = $repo1->save(new ChatSession(publicToken: 'cross-org-token'));

        // org2 cannot access org1's session by id
        self::assertNull($repo2->findById($id));
        // org1 can access it
        self::assertNotNull($repo1->findById($id));
    }
}
