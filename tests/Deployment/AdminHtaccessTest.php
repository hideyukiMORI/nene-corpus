<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Deployment;

use PHPUnit\Framework\TestCase;

final class AdminHtaccessTest extends TestCase
{
    private const REQUIRED_API_PREFIXES = [
        'auth',
        'sources',
        'ingestion',
        'appearance',
        'chat',
        'settings',
        'documents',
        'notifications',
        'analytics',
        'bootstrap',
        'superadmin',
    ];

    public function test_admin_htaccess_files_route_api_prefixes_to_php(): void
    {
        $projectRoot = dirname(__DIR__, 2);
        $paths = [
            'public_html/admin/.htaccess' => $projectRoot . '/public_html/admin/.htaccess',
            'frontend/apps/admin/public/.htaccess' => $projectRoot . '/frontend/apps/admin/public/.htaccess',
        ];

        $apiRules = [];

        foreach ($paths as $label => $path) {
            self::assertFileExists($path, $label . ' must exist');
            $apiRules[$label] = $this->extractApiRouteRule((string) file_get_contents($path), $label);
        }

        self::assertSame($apiRules['public_html/admin/.htaccess'], $apiRules['frontend/apps/admin/public/.htaccess']);

        foreach (self::REQUIRED_API_PREFIXES as $prefix) {
            self::assertStringContainsString($prefix, $apiRules['public_html/admin/.htaccess']);
        }
    }

    private function extractApiRouteRule(string $contents, string $label): string
    {
        // API は複数の RewriteRule（サブパス / メソッド / ヘッダー判定）に分割されている
        // ため、`../index.php` へ流す全ルールを集約して検証する。
        $rules = [];

        foreach (preg_split('/\R/', $contents) ?: [] as $line) {
            $line = trim($line);
            if (!str_starts_with($line, 'RewriteRule ^(')) {
                continue;
            }

            if (!str_contains($line, '../index.php')) {
                continue;
            }

            $rules[] = $line;
        }

        if ($rules === []) {
            self::fail($label . ' must contain an admin API RewriteRule');
        }

        return implode("\n", $rules);
    }
}
