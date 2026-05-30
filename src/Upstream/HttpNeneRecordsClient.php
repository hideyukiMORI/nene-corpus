<?php

declare(strict_types=1);

namespace NeneCorpus\Upstream;

final readonly class HttpNeneRecordsClient implements NeneRecordsClientInterface
{
    public function __construct(private NeneRecordsConfig $config)
    {
    }

    public function searchEntities(string $query, int $limit = 5): array
    {
        $url = rtrim((string) $this->config->baseUrl, '/') . '/api/v1/entities?' . http_build_query([
            'q' => $query,
            'status' => 'published',
            'limit' => $limit,
        ]);

        $response = $this->get($url);

        if ($response === null) {
            return [];
        }

        $data = json_decode($response, true);

        if (!is_array($data) || !isset($data['items']) || !is_array($data['items'])) {
            return [];
        }

        return array_map(
            static fn (mixed $item): NeneRecordsEntity => NeneRecordsEntity::fromArray(
                is_array($item) ? $item : [],
            ),
            $data['items'],
        );
    }

    public function getRecord(string $entityTypeSlug, string $entitySlug): ?NeneRecordsEntity
    {
        $url = rtrim((string) $this->config->baseUrl, '/')
            . '/api/v1/public/entity-types/'
            . rawurlencode($entityTypeSlug)
            . '/records/'
            . rawurlencode($entitySlug);

        $response = $this->get($url);

        if ($response === null) {
            return null;
        }

        $data = json_decode($response, true);

        if (!is_array($data) || !isset($data['entity']) || !is_array($data['entity'])) {
            return null;
        }

        return NeneRecordsEntity::fromArray($data['entity']);
    }

    public function ping(): bool
    {
        $url = rtrim((string) $this->config->baseUrl, '/') . '/health';
        $response = $this->get($url);

        return $response !== null;
    }

    private function get(string $url): ?string
    {
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => $this->buildHeaders(),
                'timeout' => 5.0,
                'ignore_errors' => true,
            ],
        ]);

        $body = @file_get_contents($url, false, $ctx);

        if ($body === false) {
            return null;
        }

        // $http_response_header is set by file_get_contents
        $statusLine = $http_response_header[0] ?? '';
        preg_match('/HTTP\/\S+ (\d{3})/', $statusLine, $m);
        $status = isset($m[1]) ? (int) $m[1] : 0;

        return ($status >= 200 && $status < 300) ? $body : null;
    }

    private function buildHeaders(): string
    {
        $headers = ["Accept: application/json\r\n"];

        if ($this->config->bearerToken !== null) {
            $headers[] = "Authorization: Bearer {$this->config->bearerToken}\r\n";
        }

        return implode('', $headers);
    }
}
