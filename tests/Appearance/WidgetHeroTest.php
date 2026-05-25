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
        self::assertTrue($hero->showImage);
        self::assertNull($hero->imageUrl);
    }

    public function test_from_array_parses_image_fields(): void
    {
        $hero = WidgetHero::fromArray([
            'image_url' => '/media/hero/a1b2c3d4e5f67890_logo.png',
            'image_alt' => 'Logo',
            'show_image' => false,
        ]);

        self::assertSame('/media/hero/a1b2c3d4e5f67890_logo.png', $hero->imageUrl);
        self::assertSame('Logo', $hero->imageAlt);
        self::assertFalse($hero->showImage);
    }

    public function test_from_array_rejects_invalid_image_url(): void
    {
        $hero = WidgetHero::fromArray([
            'image_url' => 'https://evil.example/logo.png',
        ]);

        self::assertNull($hero->imageUrl);
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
            imageUrl: '/media/hero/a1b2c3d4e5f67890_logo.png',
            imageAlt: 'Logo',
            showImage: true,
        );

        self::assertSame([
            'title' => null,
            'description' => 'Desc',
            'cta_label' => null,
            'show_title' => false,
            'show_description' => true,
            'show_cta' => false,
            'image_url' => '/media/hero/a1b2c3d4e5f67890_logo.png',
            'image_alt' => 'Logo',
            'show_image' => true,
            'gap_after' => '1rem',
            'padding_bottom' => '1rem',
            'show_divider' => true,
        ], $hero->toArray());
    }
}
