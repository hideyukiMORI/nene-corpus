<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\ChatLimits;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\ChatLimits\ChatLimitsSettings;
use NeneCorpus\ChatLimits\PdoChatLimitsRepository;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\ChatLimitsSchemaSetup;
use NeneCorpus\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

/**
 * Tests that chat-limits settings are isolated per organization.
 */
final class PdoChatLimitsRepositoryOrgIsolationTest extends TestCase
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

        ChatLimitsSchemaSetup::create($this->executor);

        $this->orgIdHolder = new RequestScopedOrgIdHolder();
    }

    private function repoFor(int $orgId): PdoChatLimitsRepository
    {
        $this->orgIdHolder->setId($orgId);

        return new PdoChatLimitsRepository($this->executor, $this->orgIdHolder, new FixedClock());
    }

    private function settingsWithMaxChars(int $maxChars): ChatLimitsSettings
    {
        return new ChatLimitsSettings(
            maxMessageChars: $maxChars,
            messageIntervalSeconds: 10,
            sessionRequestsPerHour: 20,
            ipRequestsPerHour: 60,
            dailyRequestsPerIp: 200,
            dailyRequestsGlobal: 2000,
            dailyTokensPerIp: 0,
            dailyTokensGlobal: 0,
        );
    }

    public function test_save_for_org1_does_not_appear_for_org2(): void
    {
        $this->repoFor(1)->save($this->settingsWithMaxChars(500));

        // org 2 はまだ保存していないのでデフォルト値が返る
        $defaults = ChatLimitsSettings::defaults();
        $settingsOrg2 = $this->repoFor(2)->get();

        self::assertSame($defaults->maxMessageChars, $settingsOrg2->maxMessageChars, 'org 2 は org 1 の設定を参照してはいけない');
    }

    public function test_orgs_have_independent_chat_limits(): void
    {
        $this->repoFor(1)->save($this->settingsWithMaxChars(300));
        $this->repoFor(2)->save($this->settingsWithMaxChars(800));

        self::assertSame(300, $this->repoFor(1)->get()->maxMessageChars);
        self::assertSame(800, $this->repoFor(2)->get()->maxMessageChars);
    }

    public function test_update_for_org1_does_not_affect_org2(): void
    {
        // 両 org に同じ設定を保存
        $this->repoFor(1)->save($this->settingsWithMaxChars(600));
        $this->repoFor(2)->save($this->settingsWithMaxChars(600));

        // org 1 だけ更新
        $this->repoFor(1)->save($this->settingsWithMaxChars(400));

        self::assertSame(400, $this->repoFor(1)->get()->maxMessageChars);
        self::assertSame(600, $this->repoFor(2)->get()->maxMessageChars);
    }
}
