<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class AppearanceBoolean
{
    public static function isValid(mixed $value): bool
    {
        if (is_bool($value)) {
            return true;
        }

        if ($value === 1 || $value === '1' || $value === 'true') {
            return true;
        }

        if ($value === 0 || $value === '0' || $value === 'false') {
            return true;
        }

        return false;
    }

    public static function toBool(mixed $value, bool $fallback = false): bool
    {
        if (!self::isValid($value)) {
            return $fallback;
        }

        if (is_bool($value)) {
            return $value;
        }

        if ($value === 1 || $value === '1' || $value === 'true') {
            return true;
        }

        return false;
    }
}
