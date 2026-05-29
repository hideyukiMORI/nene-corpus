<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\SystemConfig;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\SystemConfig\GetSystemConfigUseCase;
use NeneCorpus\SystemConfig\InvalidTenantResolutionModeException;
use NeneCorpus\SystemConfig\PdoSystemConfigRepository;
use NeneCorpus\SystemConfig\UpdateSystemConfigInput;
use NeneCorpus\SystemConfig\UpdateSystemConfigUseCase;
use NeneCorpus\Tests\Support\TenancySchemaSetup;
use PHPUnit\Framework\TestCase;

final class SystemConfigUseCaseTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;

    private PdoSystemConfigRepository $repository;

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

        TenancySchemaSetup::createSystemConfig($this->executor);
        TenancySchemaSetup::seedSystemConfig($this->executor);

        $this->repository = new PdoSystemConfigRepository($this->executor);
    }

    public function test_get_returns_default_config(): void
    {
        $useCase = new GetSystemConfigUseCase($this->repository);
        $config = $useCase->execute();

        self::assertSame('single', $config->tenantResolutionMode);
        self::assertSame('default', $config->tenantOrgSlug);
        self::assertSame('localhost', $config->tenantBaseDomain);
    }

    public function test_update_persists_valid_config(): void
    {
        $updateUseCase = new UpdateSystemConfigUseCase($this->repository);
        $output = $updateUseCase->execute(new UpdateSystemConfigInput(
            tenantResolutionMode: 'single',
            tenantOrgSlug: 'my-org',
            tenantBaseDomain: 'example.com',
        ));

        self::assertSame('single', $output->config->tenantResolutionMode);
        self::assertSame('my-org', $output->config->tenantOrgSlug);
        self::assertSame('example.com', $output->config->tenantBaseDomain);

        // Verify persisted
        $getUseCase = new GetSystemConfigUseCase($this->repository);
        $config = $getUseCase->execute();
        self::assertSame('my-org', $config->tenantOrgSlug);
    }

    public function test_update_throws_for_invalid_mode(): void
    {
        $updateUseCase = new UpdateSystemConfigUseCase($this->repository);

        $this->expectException(InvalidTenantResolutionModeException::class);

        $updateUseCase->execute(new UpdateSystemConfigInput(
            tenantResolutionMode: 'invalid-mode',
            tenantOrgSlug: 'default',
            tenantBaseDomain: 'localhost',
        ));
    }

    public function test_valid_modes_are_single_subdomain_path(): void
    {
        self::assertSame(['single', 'subdomain', 'path'], UpdateSystemConfigUseCase::VALID_MODES);
    }
}
