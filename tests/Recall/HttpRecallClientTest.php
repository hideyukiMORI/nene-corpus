<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Recall;

use NeneCorpus\Recall\HttpRecallClient;
use NeneCorpus\Recall\RecallChunkInput;
use NeneCorpus\Recall\RecallConfig;
use NeneCorpus\Recall\RecallHttpResponse;
use NeneCorpus\Recall\RecallUnavailableException;
use NeneCorpus\Tests\Support\FakeRecallHttpTransport;
use PHPUnit\Framework\TestCase;

final class HttpRecallClientTest extends TestCase
{
    private const TOKEN = 'super-secret-recall-token';

    private function config(?string $token = null, ?float $alpha = null, bool $strict = false): RecallConfig
    {
        return new RecallConfig(
            baseUrl: 'http://recall.local:8080/',
            bearerToken: $token,
            timeoutSeconds: 10,
            searchAlpha: $alpha,
            strict: $strict,
        );
    }

    public function test_search_maps_results_in_recall_order(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson(<<<'JSON'
            {
              "results": [
                {"chunk_id": 91, "external_id": 12, "score": 0.81, "vector_score": 0.9, "lexical_score": 0.4},
                {"chunk_id": 92, "external_id": 7, "score": 0.62}
              ],
              "embedder_id": "bge-m3:1024"
            }
            JSON);

        $hits = (new HttpRecallClient($this->config(), $transport))->search(1, 'safety', 10);

        self::assertCount(2, $hits);
        self::assertSame(12, $hits[0]->externalId);
        self::assertSame(91, $hits[0]->chunkId);
        self::assertSame(0.81, $hits[0]->score);
        self::assertSame(0.9, $hits[0]->vectorScore);
        self::assertSame(7, $hits[1]->externalId);
        self::assertNull($hits[1]->vectorScore);

        $request = $transport->requests[0];
        self::assertSame('POST', $request['method']);
        self::assertSame('http://recall.local:8080/v1/search', $request['url']);
        self::assertSame(
            ['org_id' => 1, 'query' => 'safety', 'limit' => 10],
            json_decode((string) $request['body'], true, 512, JSON_THROW_ON_ERROR),
        );
    }

    public function test_search_keeps_null_external_id(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson(
            '{"results": [{"chunk_id": 5, "external_id": null, "score": 0.5}]}',
        );

        $hits = (new HttpRecallClient($this->config(), $transport))->search(1, 'safety', 10);

        // Dropping it is the search repository's job; the client reports what came back.
        self::assertCount(1, $hits);
        self::assertNull($hits[0]->externalId);
    }

    public function test_search_sends_alpha_only_when_configured(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson('{"results": []}');

        (new HttpRecallClient($this->config(alpha: 0.5), $transport))->search(3, 'safety', 4);

        /** @var array<string, mixed> $payload */
        $payload = json_decode((string) $transport->requests[0]['body'], true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(0.5, $payload['alpha']);
    }

    public function test_put_chunks_sends_corpus_id_as_external_id(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson('{"accepted": 1, "chunk_ids": [77]}');

        (new HttpRecallClient($this->config(), $transport))->putChunks(2, [
            new RecallChunkInput(
                externalId: 41,
                documentId: 8,
                sourceId: 3,
                chunkIndex: 0,
                content: '安全手順',
                pageNumber: 2,
                sectionLabel: null,
            ),
        ]);

        $request = $transport->requests[0];
        self::assertSame('http://recall.local:8080/v1/chunks', $request['url']);

        /** @var array{org_id: int, chunks: list<array<string, mixed>>} $payload */
        $payload = json_decode((string) $request['body'], true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(2, $payload['org_id']);
        self::assertSame(41, $payload['chunks'][0]['external_id']);
        self::assertSame(2, $payload['chunks'][0]['page_number']);
        self::assertNull($payload['chunks'][0]['section_label']);
        // chunk_id belongs to Recall's own identity column and must never be sent.
        self::assertArrayNotHasKey('chunk_id', $payload['chunks'][0]);
    }

    public function test_put_chunks_skips_the_call_when_there_is_nothing_to_send(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson('{}');

        (new HttpRecallClient($this->config(), $transport))->putChunks(1, []);

        self::assertSame([], $transport->requests);
    }

    public function test_delete_by_document_targets_the_document_scoped_route(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson('{"deleted": 3}');

        (new HttpRecallClient($this->config(), $transport))->deleteByDocument(4, 19);

        $request = $transport->requests[0];
        self::assertSame('DELETE', $request['method']);
        self::assertSame('http://recall.local:8080/v1/documents/19/chunks?org_id=4', $request['url']);
    }

    public function test_delete_by_source_targets_the_source_scoped_route(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson('{"deleted": 9}');

        (new HttpRecallClient($this->config(), $transport))->deleteBySource(4, 21);

        self::assertSame('http://recall.local:8080/v1/sources/21/chunks?org_id=4', $transport->requests[0]['url']);
    }

    public function test_bearer_header_is_sent_when_a_token_is_configured(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson('{"results": []}');

        (new HttpRecallClient($this->config(self::TOKEN), $transport))->search(1, 'safety', 10);

        self::assertContains('Authorization: Bearer ' . self::TOKEN, $transport->requests[0]['headers']);
        self::assertContains('Content-Type: application/json', $transport->requests[0]['headers']);
        self::assertContains('Accept: application/json', $transport->requests[0]['headers']);
    }

    public function test_no_authorization_header_without_a_token(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson('{"results": []}');

        (new HttpRecallClient($this->config(), $transport))->search(1, 'safety', 10);

        foreach ($transport->requests[0]['headers'] as $header) {
            self::assertStringStartsNotWith('Authorization:', $header);
        }
    }

    public function test_unauthorized_raises_unavailable_without_leaking_the_token(): void
    {
        $transport = new FakeRecallHttpTransport(
            new RecallHttpResponse(401, '{"error": {"code": "unauthorized", "message": "bad token"}}'),
        );

        try {
            (new HttpRecallClient($this->config(self::TOKEN), $transport))->search(1, 'safety', 10);
            self::fail('Expected RecallUnavailableException.');
        } catch (RecallUnavailableException $exception) {
            self::assertStringContainsString('401', $exception->getMessage());
            // The message reaches logs and operator-facing output; a token in it
            // would be copied around forever.
            self::assertStringNotContainsString(self::TOKEN, $exception->getMessage());
        }
    }

    public function test_server_error_raises_unavailable(): void
    {
        $transport = new FakeRecallHttpTransport(new RecallHttpResponse(503, '{"error": {"code": "embedder_down"}}'));

        $this->expectException(RecallUnavailableException::class);
        $this->expectExceptionMessage('NeNe Recall search returned HTTP 503.');

        (new HttpRecallClient($this->config(), $transport))->search(1, 'safety', 10);
    }

    public function test_connection_failure_raises_unavailable(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson('{}');
        $transport->failWith('Could not resolve host: recall.local');

        $this->expectException(RecallUnavailableException::class);

        (new HttpRecallClient($this->config(), $transport))->putChunks(1, [
            new RecallChunkInput(externalId: 1, documentId: 1, sourceId: 1, chunkIndex: 0, content: 'x'),
        ]);
    }

    public function test_malformed_json_raises_unavailable(): void
    {
        $transport = FakeRecallHttpTransport::respondingJson('{"results": [');

        $this->expectException(RecallUnavailableException::class);
        $this->expectExceptionMessage('malformed JSON');

        (new HttpRecallClient($this->config(), $transport))->search(1, 'safety', 10);
    }

    public function test_empty_body_on_delete_is_accepted(): void
    {
        $transport = new FakeRecallHttpTransport(new RecallHttpResponse(204, ''));

        (new HttpRecallClient($this->config(), $transport))->deleteBySource(1, 2);

        self::assertCount(1, $transport->requests);
    }
}
