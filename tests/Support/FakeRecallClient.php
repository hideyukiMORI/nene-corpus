<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use NeneCorpus\Recall\RecallChunkInput;
use NeneCorpus\Recall\RecallClientInterface;
use NeneCorpus\Recall\RecallSearchHit;
use NeneCorpus\Recall\RecallUnavailableException;

/**
 * Stands in for a Recall server in repository-level tests.
 */
final class FakeRecallClient implements RecallClientInterface
{
    /** @var list<RecallSearchHit> */
    private array $hits = [];

    private ?string $failure = null;

    /** @var list<array{org_id: int, query: string, limit: int}> */
    public array $searches = [];

    /** @var list<array{org_id: int, chunks: list<RecallChunkInput>}> */
    public array $puts = [];

    /** @var list<array{org_id: int, document_id: int}> */
    public array $documentDeletes = [];

    /** @var list<array{org_id: int, source_id: int}> */
    public array $sourceDeletes = [];

    /**
     * @param list<RecallSearchHit> $hits
     */
    public function willReturn(array $hits): void
    {
        $this->hits = $hits;
    }

    public function willFail(string $message = 'NeNe Recall search returned HTTP 503.'): void
    {
        $this->failure = $message;
    }

    public function search(int $orgId, string $query, int $limit): array
    {
        $this->searches[] = ['org_id' => $orgId, 'query' => $query, 'limit' => $limit];

        $this->guard();

        return $this->hits;
    }

    public function putChunks(int $orgId, array $chunks): void
    {
        $this->puts[] = ['org_id' => $orgId, 'chunks' => $chunks];

        $this->guard();
    }

    public function deleteByDocument(int $orgId, int $documentId): void
    {
        $this->documentDeletes[] = ['org_id' => $orgId, 'document_id' => $documentId];

        $this->guard();
    }

    public function deleteBySource(int $orgId, int $sourceId): void
    {
        $this->sourceDeletes[] = ['org_id' => $orgId, 'source_id' => $sourceId];

        $this->guard();
    }

    private function guard(): void
    {
        if ($this->failure !== null) {
            throw new RecallUnavailableException($this->failure);
        }
    }
}
