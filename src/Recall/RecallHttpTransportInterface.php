<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

/**
 * The HTTP execution of a Recall call, and nothing else.
 *
 * 🔴 This seam exists so the client is testable. `HttpNeneRecordsClient` has no
 * tests for exactly one reason — there is no place to substitute the network in
 * it — and repeating that shape here would repeat the gap (ADR 0007 Decision 1).
 *
 * Building URLs, headers and bodies, and deciding what a status code means, all
 * belong to {@see HttpRecallClient}; an implementation of this interface only
 * moves bytes.
 */
interface RecallHttpTransportInterface
{
    /**
     * @param list<string> $headers Fully formed header lines ("Name: value")
     *
     * @throws RecallUnavailableException when the request could not be completed at all
     */
    public function post(string $url, array $headers, string $body): RecallHttpResponse;

    /**
     * @param list<string> $headers
     *
     * @throws RecallUnavailableException
     */
    public function delete(string $url, array $headers): RecallHttpResponse;
}
