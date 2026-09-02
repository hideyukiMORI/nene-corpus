<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Support;

use NeneCorpus\Recall\RecallHttpResponse;
use NeneCorpus\Recall\RecallHttpTransportInterface;
use NeneCorpus\Recall\RecallUnavailableException;

/**
 * Records what the client sent and replays canned responses.
 *
 * This is the substitution point that ADR 0007 required the client to have; it
 * is what lets the HTTP contract be tested without a Recall server.
 */
final class FakeRecallHttpTransport implements RecallHttpTransportInterface
{
    /** @var list<array{method: string, url: string, headers: list<string>, body: ?string}> */
    public array $requests = [];

    /** @var list<RecallHttpResponse> */
    private array $responses = [];

    private ?string $failure = null;

    public function __construct(RecallHttpResponse ...$responses)
    {
        $this->responses = array_values($responses);
    }

    public static function respondingJson(string $json, int $statusCode = 200): self
    {
        return new self(new RecallHttpResponse($statusCode, $json));
    }

    /**
     * Makes every call fail the way an unreachable host does.
     */
    public function failWith(string $detail): void
    {
        $this->failure = $detail;
    }

    public function post(string $url, array $headers, string $body): RecallHttpResponse
    {
        return $this->record('POST', $url, $headers, $body);
    }

    public function delete(string $url, array $headers): RecallHttpResponse
    {
        return $this->record('DELETE', $url, $headers, null);
    }

    /**
     * @param list<string> $headers
     */
    private function record(string $method, string $url, array $headers, ?string $body): RecallHttpResponse
    {
        $this->requests[] = ['method' => $method, 'url' => $url, 'headers' => $headers, 'body' => $body];

        if ($this->failure !== null) {
            throw RecallUnavailableException::transport('request', $this->failure);
        }

        return array_shift($this->responses) ?? new RecallHttpResponse(200, '{}');
    }
}
