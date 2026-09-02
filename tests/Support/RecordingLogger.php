<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use Psr\Log\AbstractLogger;
use Stringable;

/**
 * Minimal PSR-3 spy. psr/log 3 dropped its own `TestLogger`, and a warning that
 * has to be observable ("the search silently degraded") deserves an assertion
 * rather than a NullLogger.
 */
final class RecordingLogger extends AbstractLogger
{
    /** @var list<array{level: string, message: string, context: array<mixed>}> */
    public array $records = [];

    /**
     * @param mixed         $level
     * @param array<mixed>  $context
     */
    public function log($level, string|Stringable $message, array $context = []): void
    {
        $this->records[] = [
            'level' => is_scalar($level) ? (string) $level : 'unknown',
            'message' => (string) $message,
            'context' => $context,
        ];
    }

    public function hasWarningContaining(string $needle): bool
    {
        foreach ($this->records as $record) {
            if ($record['level'] === 'warning' && str_contains($record['message'], $needle)) {
                return true;
            }
        }

        return false;
    }
}
