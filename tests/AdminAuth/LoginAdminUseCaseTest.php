<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\AdminAuth;

use Nene2\Auth\LocalBearerTokenVerifier;
use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\AdminAuth\LoginAdminInput;
use NeneCorpus\AdminAuth\LoginAdminUseCase;
use NeneCorpus\AdminAuth\PdoAdminUserRepository;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use PHPUnit\Framework\TestCase;

final class LoginAdminUseCaseTest extends TestCase
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

        CorpusSchemaSetup::createAdminUsers($this->executor);

        $hash = password_hash('secret-password', PASSWORD_ARGON2ID);
        $now = gmdate('Y-m-d H:i:s');
        $this->executor->execute(
            'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            ['admin@example.com', $hash, $now, $now],
        );
    }

    public function test_execute_returns_access_token_for_valid_credentials(): void
    {
        $useCase = new LoginAdminUseCase(
            new PdoAdminUserRepository($this->executor),
            new LocalBearerTokenVerifier('test-jwt-secret'),
        );

        $output = $useCase->execute(new LoginAdminInput(
            email: 'admin@example.com',
            password: 'secret-password',
        ));

        self::assertSame('Bearer', $output->tokenType);
        self::assertNotSame('', $output->accessToken);
        self::assertNotSame('', $output->expiresAt);
    }

    public function test_execute_throws_for_invalid_password(): void
    {
        $useCase = new LoginAdminUseCase(
            new PdoAdminUserRepository($this->executor),
            new LocalBearerTokenVerifier('test-jwt-secret'),
        );

        $this->expectException(\NeneCorpus\AdminAuth\InvalidAdminCredentialsException::class);

        $useCase->execute(new LoginAdminInput(
            email: 'admin@example.com',
            password: 'wrong-password',
        ));
    }
}
