<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

use JsonException;

/**
 * Talks to the NeNe Recall HTTP API (its `docs/openapi/openapi.yaml`).
 *
 * Failure handling differs from {@see \NeneCorpus\Upstream\HttpNeneRecordsClient},
 * which returns empty results on error: here an empty result is indistinguishable
 * from "nothing matched", and Claude would answer with no evidence. Every failure
 * therefore raises {@see RecallUnavailableException} and the caller decides
 * (ADR 0007 Decision 2 / Decision 3).
 */
final readonly class HttpRecallClient implements RecallClientInterface
{
    public function __construct(
        private RecallConfig $config,
        private RecallHttpTransportInterface $transport,
    ) {
    }

    public function search(int $orgId, string $query, int $limit): array
    {
        $payload = [
            'org_id' => $orgId,
            'query' => $query,
            'limit' => $limit,
        ];

        if ($this->config->searchAlpha !== null) {
            $payload['alpha'] = $this->config->searchAlpha;
        }

        $decoded = $this->exchange('search', $this->config->endpoint('/v1/search'), $payload);
        $results = $decoded['results'] ?? [];

        if (!is_array($results)) {
            throw RecallUnavailableException::malformedResponse('search');
        }

        $hits = [];

        foreach ($results as $result) {
            if (!is_array($result)) {
                continue;
            }

            $chunkId = $result['chunk_id'] ?? null;
            $score = $result['score'] ?? null;

            if (!is_int($chunkId) || !is_numeric($score)) {
                continue;
            }

            $hits[] = new RecallSearchHit(
                chunkId: $chunkId,
                externalId: is_int($result['external_id'] ?? null) ? (int) $result['external_id'] : null,
                score: (float) $score,
                vectorScore: is_numeric($result['vector_score'] ?? null) ? (float) $result['vector_score'] : null,
                lexicalScore: is_numeric($result['lexical_score'] ?? null) ? (float) $result['lexical_score'] : null,
            );
        }

        return $hits;
    }

    public function putChunks(int $orgId, array $chunks): void
    {
        if ($chunks === []) {
            return;
        }

        $this->exchange('putChunks', $this->config->endpoint('/v1/chunks'), [
            'org_id' => $orgId,
            'chunks' => array_map(
                static fn (RecallChunkInput $chunk): array => $chunk->toPayload(),
                $chunks,
            ),
        ]);
    }

    public function deleteByDocument(int $orgId, int $documentId): void
    {
        $this->requestDelete(
            'deleteByDocument',
            $this->config->endpoint('/v1/documents/' . $documentId . '/chunks'),
            $orgId,
        );
    }

    public function deleteBySource(int $orgId, int $sourceId): void
    {
        $this->requestDelete(
            'deleteBySource',
            $this->config->endpoint('/v1/sources/' . $sourceId . '/chunks'),
            $orgId,
        );
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    private function exchange(string $operation, string $url, array $payload): array
    {
        try {
            $body = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        } catch (JsonException $exception) {
            throw RecallUnavailableException::transport($operation, 'the request body could not be encoded.');
        }

        $response = $this->transport->post($url, $this->headers(withBody: true), $body);

        return $this->decode($operation, $response);
    }

    private function requestDelete(string $operation, string $url, int $orgId): void
    {
        // org_id travels as a query parameter on DELETE, exactly as Recall's
        // source-scoped delete already does (Recall OpenAPI, ADR 0003).
        $response = $this->transport->delete(
            $url . '?' . http_build_query(['org_id' => $orgId]),
            $this->headers(withBody: false),
        );

        $this->decode($operation, $response);
    }

    /**
     * @return array<string, mixed>
     */
    private function decode(string $operation, RecallHttpResponse $response): array
    {
        if (!$response->isSuccessful()) {
            // The body may echo the request; only the status code is reported so
            // that nothing from the exchange can leak into logs.
            throw RecallUnavailableException::status($operation, $response->statusCode);
        }

        if (trim($response->body) === '') {
            return [];
        }

        try {
            $decoded = json_decode($response->body, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw RecallUnavailableException::malformedResponse($operation);
        }

        if (!is_array($decoded)) {
            throw RecallUnavailableException::malformedResponse($operation);
        }

        /** @var array<string, mixed> $decoded */
        return $decoded;
    }

    /**
     * @return list<string>
     */
    private function headers(bool $withBody): array
    {
        $headers = ['Accept: application/json'];

        if ($withBody) {
            $headers[] = 'Content-Type: application/json';
        }

        if ($this->config->bearerToken !== null) {
            $headers[] = 'Authorization: Bearer ' . $this->config->bearerToken;
        }

        return $headers;
    }
}
