<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

use Closure;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;

/**
 * Rebuilds one organization's index in Recall (ADR 0007 Decision 4).
 *
 * This is the recovery path for everything the write-through decorator can miss:
 * a database transaction that rolled back after Recall had already accepted the
 * chunk, an ingestion run against a Recall that was down, or a Recall restored
 * from an older backup.
 *
 * 🔴 Stale rows are cleared **per source, before writing**, not by diffing.
 * Recall exposes no "list every external_id you hold", so the only way to be sure
 * an id that no longer exists in Corpus is gone is to drop each live source's
 * chunks and write them again. Sources that Corpus has already forgotten
 * entirely are outside this command's reach — that is why the ingestion path
 * deletes eagerly instead of leaving it to the reindex.
 */
final readonly class RecallReindexer
{
    public const BATCH_SIZE = 1000;

    public function __construct(
        private RecallClientInterface $recall,
        private RecallReindexReaderInterface $reader,
        private RequestScopedOrgIdHolder $orgIdHolder,
    ) {
    }

    /**
     * @param Closure(string): void|null $progress
     */
    public function reindex(int $organizationId, ?Closure $progress = null): RecallReindexReport
    {
        $this->orgIdHolder->setId($organizationId);

        $sourceIds = $this->reader->listAliveSourceIds();

        foreach ($sourceIds as $sourceId) {
            $this->recall->deleteBySource($organizationId, $sourceId);
        }

        $this->report($progress, sprintf('org %d: cleared %d source(s) in Recall', $organizationId, count($sourceIds)));

        $afterId = 0;
        $indexed = 0;

        while (true) {
            $chunks = $this->reader->listAliveChunks($afterId, self::BATCH_SIZE);

            if ($chunks === []) {
                break;
            }

            $batch = [];

            foreach ($chunks as $chunk) {
                // Every chunk read from the database has an id; the null in the
                // entity is for chunks that have not been saved yet.
                $chunkId = $chunk->id ?? 0;
                $afterId = max($afterId, $chunkId);
                $batch[] = RecallChunkInput::fromChunk($chunkId, $chunk);
            }

            $this->recall->putChunks($organizationId, $batch);
            $indexed += count($batch);

            $this->report($progress, sprintf('org %d: indexed %d chunk(s)', $organizationId, $indexed));

            if (count($chunks) < self::BATCH_SIZE) {
                break;
            }
        }

        return new RecallReindexReport(
            organizationId: $organizationId,
            clearedSources: count($sourceIds),
            indexedChunks: $indexed,
        );
    }

    /**
     * @param Closure(string): void|null $progress
     */
    private function report(?Closure $progress, string $message): void
    {
        if ($progress !== null) {
            $progress($message);
        }
    }
}
