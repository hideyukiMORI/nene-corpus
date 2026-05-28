<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Analytics;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Analytics\PdoAnalyticsRepository;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\ChatSchemaSetup;
use PHPUnit\Framework\TestCase;

final class PdoAnalyticsRepositoryTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;
    private RequestScopedOrgIdHolder $holder;

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

        $this->holder = new RequestScopedOrgIdHolder();
        $this->holder->setId(1);
    }

    // ── ヘルパー ──────────────────────────────────────────────────────────────

    private function repo(?int $orgId = 1): PdoAnalyticsRepository
    {
        $holder = new RequestScopedOrgIdHolder();

        if ($orgId !== null) {
            $holder->setId($orgId);
        }

        return new PdoAnalyticsRepository($this->executor, $holder);
    }

    private function insertSession(int $orgId, string $token, string $createdAt = '2026-05-01 10:00:00'): int
    {
        $this->executor->execute(
            'INSERT INTO chat_sessions (organization_id, public_token, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [$orgId, $token, $createdAt, $createdAt],
        );

        $row = $this->executor->fetchOne('SELECT last_insert_rowid() AS id');
        assert($row !== null);

        return (int) $row['id'];
    }

    private function insertMessage(int $orgId, int $sessionId, string $role, string $content = 'hello', ?string $citationsJson = null, ?int $inputTokens = null, ?int $outputTokens = null, string $createdAt = '2026-05-01 10:01:00'): void
    {
        $this->executor->execute(
            'INSERT INTO chat_messages (organization_id, session_id, role, content, citations_json, input_tokens, output_tokens, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$orgId, $sessionId, $role, $content, $citationsJson, $inputTokens, $outputTokens, $createdAt, $createdAt],
        );
    }

    // ── countSessionsTotal ────────────────────────────────────────────────────

    public function test_countSessionsTotal_returns_count_for_own_org(): void
    {
        $this->insertSession(1, 'tok-org1-a');
        $this->insertSession(1, 'tok-org1-b');
        $this->insertSession(2, 'tok-org2-a');

        self::assertSame(2, $this->repo(1)->countSessionsTotal());
        self::assertSame(1, $this->repo(2)->countSessionsTotal());
    }

    // ── countMessagesByRole ───────────────────────────────────────────────────

    public function test_countMessagesByRole_is_scoped_to_org(): void
    {
        $s1 = $this->insertSession(1, 'tok-msg-org1');
        $s2 = $this->insertSession(2, 'tok-msg-org2');

        $this->insertMessage(1, $s1, 'user');
        $this->insertMessage(1, $s1, 'assistant');
        $this->insertMessage(2, $s2, 'user');

        self::assertSame(1, $this->repo(1)->countMessagesByRole('user'));
        self::assertSame(1, $this->repo(1)->countMessagesByRole('assistant'));
        // Org 2 only sees its own message
        self::assertSame(1, $this->repo(2)->countMessagesByRole('user'));
        self::assertSame(0, $this->repo(2)->countMessagesByRole('assistant'));
    }

    // ── sumTokens ─────────────────────────────────────────────────────────────

    public function test_sumTokens_is_scoped_to_org(): void
    {
        $s1 = $this->insertSession(1, 'tok-token-org1');
        $s2 = $this->insertSession(2, 'tok-token-org2');

        $this->insertMessage(1, $s1, 'assistant', 'reply', null, 100, 50);
        $this->insertMessage(2, $s2, 'assistant', 'reply', null, 200, 80);

        self::assertSame(100, $this->repo(1)->sumTokens('input_tokens'));
        self::assertSame(50, $this->repo(1)->sumTokens('output_tokens'));
        self::assertSame(200, $this->repo(2)->sumTokens('input_tokens'));
    }

    // ── citationRate ──────────────────────────────────────────────────────────

    public function test_citationRate_is_scoped_to_org(): void
    {
        $s1 = $this->insertSession(1, 'tok-cite-org1');
        $s2 = $this->insertSession(2, 'tok-cite-org2');

        // Org 1: 1 cited out of 2 assistant messages = 0.5
        $this->insertMessage(1, $s1, 'assistant', 'reply', '[{"chunk_id":1}]');
        $this->insertMessage(1, $s1, 'assistant', 'reply', '[]');
        // Org 2: 1 cited out of 1 = 1.0
        $this->insertMessage(2, $s2, 'assistant', 'reply', '[{"chunk_id":2}]');

        self::assertSame(0.5, $this->repo(1)->citationRate());
        self::assertSame(1.0, $this->repo(2)->citationRate());
    }

    // ── avgMessagesPerSession ─────────────────────────────────────────────────

    public function test_avgMessagesPerSession_is_scoped_to_org(): void
    {
        $s1 = $this->insertSession(1, 'tok-avg-org1');
        $s2 = $this->insertSession(2, 'tok-avg-org2');

        // Org 1: 4 messages in 1 session = avg 4.0
        for ($i = 0; $i < 4; $i++) {
            $this->insertMessage(1, $s1, 'user', "q{$i}");
        }

        // Org 2: 2 messages in 1 session = avg 2.0
        $this->insertMessage(2, $s2, 'user', 'q1');
        $this->insertMessage(2, $s2, 'user', 'q2');

        self::assertSame(4.0, $this->repo(1)->avgMessagesPerSession());
        self::assertSame(2.0, $this->repo(2)->avgMessagesPerSession());
    }

    // ── topQuestions ──────────────────────────────────────────────────────────

    public function test_topQuestions_is_scoped_to_org(): void
    {
        $s1 = $this->insertSession(1, 'tok-tq-org1');
        $s2 = $this->insertSession(2, 'tok-tq-org2');

        $this->insertMessage(1, $s1, 'user', 'what is X?');
        $this->insertMessage(2, $s2, 'user', 'org2 question?');

        $questions = $this->repo(1)->topQuestions(10, null, null);

        self::assertCount(1, $questions);
        self::assertSame('what is X?', $questions[0]['content']);
    }

    // ── exportSessions ────────────────────────────────────────────────────────

    public function test_exportSessions_is_scoped_to_org(): void
    {
        $s1 = $this->insertSession(1, 'tok-exp-org1');
        $this->insertSession(2, 'tok-exp-org2');

        $this->insertMessage(1, $s1, 'user');

        $rows = $this->repo(1)->exportSessions(null, null);

        self::assertCount(1, $rows);
        self::assertSame($s1, (int) $rows[0]['session_id']);
    }

    // ── exportConversations ───────────────────────────────────────────────────

    public function test_exportConversations_is_scoped_to_org(): void
    {
        $s1 = $this->insertSession(1, 'tok-conv-org1');
        $s2 = $this->insertSession(2, 'tok-conv-org2');

        $this->insertMessage(1, $s1, 'user', 'hello org1');
        $this->insertMessage(2, $s2, 'user', 'hello org2');

        $rows = $this->repo(1)->exportConversations(null, null);

        self::assertCount(1, $rows);
        self::assertSame('hello org1', (string) $rows[0]['content']);
    }

    // ── データ分離テスト ──────────────────────────────────────────────────────

    public function test_org1_data_does_not_leak_into_org2(): void
    {
        // Insert sessions for org 1 only
        $this->insertSession(1, 'tok-iso-org1-a');
        $this->insertSession(1, 'tok-iso-org1-b');

        // Org 2 must see zero sessions
        self::assertSame(0, $this->repo(2)->countSessionsTotal());
        self::assertSame(0.0, $this->repo(2)->citationRate());
        self::assertCount(0, $this->repo(2)->exportSessions(null, null));
    }
}
