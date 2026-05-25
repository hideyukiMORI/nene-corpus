<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Install;

use NeneCorpus\Install\InstallPathResolver;
use PHPUnit\Framework\TestCase;

final class InstallPathResolverTest extends TestCase
{
    public function test_normalize_base_path(): void
    {
        self::assertSame('', InstallPathResolver::normalizeBasePath(''));
        self::assertSame('', InstallPathResolver::normalizeBasePath('/'));
        self::assertSame('/nene-corpus', InstallPathResolver::normalizeBasePath('nene-corpus'));
        self::assertSame('/nene-corpus', InstallPathResolver::normalizeBasePath('/nene-corpus/'));
    }

    public function test_detect_from_script_name(): void
    {
        $_SERVER['SCRIPT_NAME'] = '/nene-corpus/index.php';
        self::assertSame('/nene-corpus', InstallPathResolver::detectFromScriptName());

        $_SERVER['SCRIPT_NAME'] = '/index.php';
        self::assertSame('', InstallPathResolver::detectFromScriptName());
    }

    public function test_public_paths_use_base_path(): void
    {
        unset($_ENV['NENE_CORPUS_BASE_PATH'], $_SERVER['NENE_CORPUS_BASE_PATH']);
        $_SERVER['SCRIPT_NAME'] = '/nene-corpus/index.php';

        $resolver = new InstallPathResolver(sys_get_temp_dir());

        self::assertSame([
            'base_path' => '/nene-corpus',
            'widget_script_src' => '/nene-corpus/widget.js',
            'widget_css_href' => '/nene-corpus/widget.css',
            'api_base' => '/nene-corpus',
        ], $resolver->publicPaths());
    }
}
