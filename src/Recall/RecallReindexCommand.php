<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

use Closure;
use NeneCorpus\Organization\OrganizationRepositoryInterface;

/**
 * `recall:reindex [--org=<id>]` — argument parsing and reporting.
 *
 * The work itself is in {@see RecallReindexer}; keeping the console entry point
 * free of logic is what makes this testable without a terminal.
 */
final readonly class RecallReindexCommand
{
    public const NAME = 'recall:reindex';

    public const USAGE = 'Usage: bin/console recall:reindex [--org=<id>]';

    public function __construct(
        private RecallConfig $config,
        private RecallReindexer $reindexer,
        private OrganizationRepositoryInterface $organizations,
    ) {
    }

    /**
     * @param list<string>        $arguments Arguments after the command name
     * @param Closure(string): void $out
     *
     * @return int Process exit code
     */
    public function run(array $arguments, Closure $out): int
    {
        if (!$this->config->isConfigured()) {
            $out('NENE_RECALL_BASE_URL is not set — nothing to reindex.');

            return 1;
        }

        $organizationId = null;

        foreach ($arguments as $argument) {
            if (str_starts_with($argument, '--org=')) {
                $value = substr($argument, strlen('--org='));

                if (!ctype_digit($value) || (int) $value < 1) {
                    $out('--org must be a positive integer.');
                    $out(self::USAGE);

                    return 1;
                }

                $organizationId = (int) $value;

                continue;
            }

            $out(sprintf('Unknown argument: %s', $argument));
            $out(self::USAGE);

            return 1;
        }

        $organizationIds = $organizationId !== null
            ? [$organizationId]
            : $this->allOrganizationIds();

        if ($organizationIds === []) {
            $out('No organizations found.');

            return 1;
        }

        try {
            foreach ($organizationIds as $id) {
                $report = $this->reindexer->reindex($id, $out);

                $out(sprintf(
                    'org %d: done — %d source(s) cleared, %d chunk(s) indexed.',
                    $report->organizationId,
                    $report->clearedSources,
                    $report->indexedChunks,
                ));
            }
        } catch (RecallUnavailableException $exception) {
            // Stop at the first failure: continuing would leave later
            // organizations half-cleared without saying so.
            $out('Reindex aborted: ' . $exception->getMessage());

            return 1;
        }

        return 0;
    }

    /**
     * @return list<int>
     */
    private function allOrganizationIds(): array
    {
        $ids = [];

        foreach ($this->organizations->listAll() as $organization) {
            if ($organization->id !== null) {
                $ids[] = $organization->id;
            }
        }

        return $ids;
    }
}
