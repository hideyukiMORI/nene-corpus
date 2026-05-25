<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Llm;

use NeneCorpus\Llm\AnthropicApiKeyMask;
use PHPUnit\Framework\TestCase;

final class AnthropicApiKeyMaskTest extends TestCase
{
    public function test_mask_returns_null_for_empty_key(): void
    {
        self::assertNull(AnthropicApiKeyMask::mask(null));
        self::assertNull(AnthropicApiKeyMask::mask(''));
    }

    public function test_mask_shows_prefix_and_suffix(): void
    {
        self::assertSame('sk-ant-…cdef', AnthropicApiKeyMask::mask('sk-ant-api03-abcdef'));
    }
}
