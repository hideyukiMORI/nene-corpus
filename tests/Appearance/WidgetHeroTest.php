<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Appearance;

use NeneCorpus\Appearance\WidgetHero;
use PHPUnit\Framework\TestCase;

final class WidgetHeroTest extends TestCase
{
    public function test_from_array_defaults_show_flags_to_true(): void
    {
        $hero = WidgetHero::fromArray([
            'title' => 'Hello',
        ]);

        self::assertSame('Hello', $hero->title);
        self::assertTrue($hero->showTitle);
        self::assertTrue($hero->showDescription);
        self::assertTrue($hero->showCta);
    }

    public function test_to_array_includes_show_flags(): void
    {
        $hero = new WidgetHero(
            title: null,
            description: 'Desc',
            ctaLabel: null,
            showTitle: false,
            showDescription: true,
            showCta: false,
        );

        self::assertSame([
            'title' => null,
            'description' => 'Desc',
            'cta_label' => null,
            'show_title' => false,
            'show_description' => true,
            'show_cta' => false,
        ], $hero->toArray());
    }
}
