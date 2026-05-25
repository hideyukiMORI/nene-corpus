<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class RunInstallHandler
{
    public function __construct(
        private RunInstallUseCase $useCase,
        private InstallPathResolver $pathResolver,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $database = is_array($body['database'] ?? null) ? $body['database'] : [];
        $admin = is_array($body['admin'] ?? null) ? $body['admin'] : [];

        $email = strtolower(trim((string) ($admin['email'] ?? '')));
        $password = (string) ($admin['password'] ?? '');
        $adapter = strtolower(trim((string) ($database['adapter'] ?? 'mysql')));
        $host = trim((string) ($database['host'] ?? ''));
        $port = (int) ($database['port'] ?? 3306);
        $name = trim((string) ($database['name'] ?? ''));
        $user = trim((string) ($database['user'] ?? ''));
        $passwordDb = (string) ($database['password'] ?? '');
        $charset = trim((string) ($database['charset'] ?? 'utf8mb4'));
        $environment = trim((string) ($database['environment'] ?? 'production'));
        $anthropicApiKey = trim((string) ($body['anthropic_api_key'] ?? ''));
        $basePathInput = trim((string) ($body['base_path'] ?? $this->pathResolver->resolve()));
        $basePath = InstallPathResolver::normalizeBasePath($basePathInput);

        $errors = [];

        if ($email === '') {
            $errors[] = new ValidationError('admin.email', 'Email is required.', 'required');
        }

        if ($password === '') {
            $errors[] = new ValidationError('admin.password', 'Password is required.', 'required');
        } elseif (strlen($password) < 8) {
            $errors[] = new ValidationError('admin.password', 'Password must be at least 8 characters.', 'min_length');
        }

        if (!in_array($adapter, ['mysql', 'sqlite'], true)) {
            $errors[] = new ValidationError('database.adapter', 'Adapter must be mysql or sqlite.', 'invalid');
        }

        if ($adapter === 'mysql') {
            if ($host === '') {
                $errors[] = new ValidationError('database.host', 'Host is required.', 'required');
            }

            if ($name === '') {
                $errors[] = new ValidationError('database.name', 'Database name is required.', 'required');
            }

            if ($user === '') {
                $errors[] = new ValidationError('database.user', 'Database user is required.', 'required');
            }
        }

        if ($adapter === 'sqlite' && $name === '') {
            $errors[] = new ValidationError('database.name', 'SQLite file path is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        if ($adapter === 'sqlite') {
            $name = $this->pathResolver->resolveProjectRelativePath($name);
        }

        $result = $this->useCase->execute(new RunInstallInput(
            database: new InstallDatabaseConfig(
                adapter: $adapter,
                host: $host,
                port: $port > 0 ? $port : 3306,
                name: $name,
                user: $user,
                password: $passwordDb,
                charset: $charset !== '' ? $charset : 'utf8mb4',
                environment: $environment !== '' ? $environment : 'production',
            ),
            adminEmail: $email,
            adminPassword: $password,
            basePath: $basePath,
            anthropicApiKey: $anthropicApiKey !== '' ? $anthropicApiKey : null,
            jwtSecret: bin2hex(random_bytes(32)),
        ));

        return $this->response->create([
            'installed' => true,
            'admin_email' => $result['admin_email'],
            'base_path' => $result['base_path'],
        ], 201);
    }
}
