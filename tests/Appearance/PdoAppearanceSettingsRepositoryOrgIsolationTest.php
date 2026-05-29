<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Appearance;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Appearance\AppearanceSettings;
use NeneCorpus\Appearance\PdoAppearanceSettingsRepository;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use PHPUnit\Framework\TestCase;

/**
 * Tests that appearance settings stored for org A are not visible to org B
 * and vice-versa.
 */
final class PdoAppearanceSettingsRepositoryOrgIsolationTest extends TestCase
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

        CorpusSchemaSetup::createAppearanceSettings($this->executor);

        $this->orgIdHolder = new RequestScopedOrgIdHolder();
    }

    private function repoFor(int $orgId): PdoAppearanceSettingsRepository
    {
        $this->orgIdHolder->setId($orgId);

        return new PdoAppearanceSettingsRepository($this->executor, $this->orgIdHolder);
    }

    private function settingsWithLocale(?string $locale): AppearanceSettings
    {
        $defaults = AppearanceSettings::defaults();

        return new AppearanceSettings(
            widgetLocale: $locale,
            theme: $defaults->theme,
            hero: $defaults->hero,
            chat: $defaults->chat,
            layout: $defaults->layout,
            customCss: null,
        );
    }

    public function test_save_for_org1_does_not_appear_for_org2(): void
    {
        $this->repoFor(1)->save($this->settingsWithLocale('ja'));

        // org 2 はまだ保存していないのでデフォルト値が返る
        $settingsOrg2 = $this->repoFor(2)->get();

        self::assertNull($settingsOrg2->widgetLocale, 'org 2 は org 1 の設定を参照してはいけない');
    }

    public function test_orgs_have_independent_appearance_settings(): void
    {
        $this->repoFor(1)->save($this->settingsWithLocale('ja'));
        $this->repoFor(2)->save($this->settingsWithLocale('en'));

        // 再読み込みして独立していることを確認
        self::assertSame('ja', $this->repoFor(1)->get()->widgetLocale);
        self::assertSame('en', $this->repoFor(2)->get()->widgetLocale);
    }

    public function test_update_for_org1_does_not_affect_org2(): void
    {
        // 両 org に同じ設定を保存
        $this->repoFor(1)->save($this->settingsWithLocale('en'));
        $this->repoFor(2)->save($this->settingsWithLocale('en'));

        // org 1 だけ 'ja' に更新
        $this->repoFor(1)->save($this->settingsWithLocale('ja'));

        // org 2 は 'en' のまま
        self::assertSame('ja', $this->repoFor(1)->get()->widgetLocale);
        self::assertSame('en', $this->repoFor(2)->get()->widgetLocale);
    }
}
