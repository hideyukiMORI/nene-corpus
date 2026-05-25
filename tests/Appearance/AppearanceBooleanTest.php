<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Appearance;

use NeneCorpus\Appearance\AppearanceBoolean;
use PHPUnit\Framework\TestCase;

final class AppearanceBooleanTest extends TestCase
{
    public function test_is_valid_accepts_common_representations(): void
    {
        self::assertTrue(AppearanceBoolean::isValid(true));
        self::assertTrue(AppearanceBoolean::isValid(false));
        self::assertTrue(AppearanceBoolean::isValid(1));
        self::assertTrue(AppearanceBoolean::isValid(0));
        self::assertTrue(AppearanceBoolean::isValid('1'));
        self::assertTrue(AppearanceBoolean::isValid('0'));
        self::assertTrue(AppearanceBoolean::isValid('true'));
        self::assertTrue(AppearanceBoolean::isValid('false'));
    }

    public function test_is_valid_rejects_unknown_values(): void
    {
        self::assertFalse(AppearanceBoolean::isValid('yes'));
        self::assertFalse(AppearanceBoolean::isValid(2));
    }

    public function test_to_bool_normalizes_values(): void
    {
        self::assertTrue(AppearanceBoolean::toBool('true'));
        self::assertFalse(AppearanceBoolean::toBool('false'));
        self::assertTrue(AppearanceBoolean::toBool('1'));
        self::assertFalse(AppearanceBoolean::toBool(0));
        self::assertTrue(AppearanceBoolean::toBool('unexpected', true));
    }
}
