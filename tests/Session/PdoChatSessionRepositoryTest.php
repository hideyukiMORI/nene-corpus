<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Session;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Session\ChatSession;
use NeneCorpus\Session\PdoChatSessionRepository;
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

    public function test_save_and_find_by_public_token(): void
    {
        $repository = new PdoChatSessionRepository($this->executor);
        $id = $repository->save(new ChatSession(publicToken: 'abc123token'));

        $session = $repository->findByPublicToken('abc123token');

        self::assertNotNull($session);
        self::assertSame($id, $session->id);
        self::assertSame('abc123token', $session->publicToken);
    }

    public function test_find_by_id_returns_saved_session(): void
    {
        $repository = new PdoChatSessionRepository($this->executor);
        $id = $repository->save(new ChatSession(publicToken: 'session-token'));

        $session = $repository->findById($id);

        self::assertNotNull($session);
        self::assertSame('session-token', $session->publicToken);
    }
}
