<?php

declare(strict_types=1);

namespace NeneCorpus\Recall;

/**
 * curl-backed transport. Same shape as {@see \NeneCorpus\Llm\HttpClaudeMessagesClient},
 * which is why no HTTP client library is pulled in (ADR 0007, rejected options).
 */
final readonly class CurlRecallHttpTransport implements RecallHttpTransportInterface
{
    public function __construct(
        private int $timeoutSeconds = RecallConfig::DEFAULT_TIMEOUT_SECONDS,
    ) {
    }

    public function post(string $url, array $headers, string $body): RecallHttpResponse
    {
        return $this->send($url, $headers, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
        ]);
    }

    public function delete(string $url, array $headers): RecallHttpResponse
    {
        return $this->send($url, $headers, [
            CURLOPT_CUSTOMREQUEST => 'DELETE',
        ]);
    }

    /**
     * @param list<string>        $headers
     * @param array<int, mixed>   $methodOptions
     */
    private function send(string $url, array $headers, array $methodOptions): RecallHttpResponse
    {
        $handle = curl_init($url);

        if ($handle === false) {
            throw RecallUnavailableException::transport('request', 'the HTTP client could not be initialised.');
        }

        curl_setopt_array($handle, $methodOptions + [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            // Connect timeout is separate so an unreachable host fails fast
            // instead of burning the whole budget on the TCP handshake.
            CURLOPT_CONNECTTIMEOUT => max(1, min(5, $this->timeoutSeconds)),
            CURLOPT_TIMEOUT => $this->timeoutSeconds,
        ]);

        $responseBody = curl_exec($handle);
        $statusCode = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $error = curl_error($handle);
        curl_close($handle);

        if (!is_string($responseBody)) {
            throw RecallUnavailableException::transport('request', $error !== '' ? $error : 'unknown transport error.');
        }

        return new RecallHttpResponse($statusCode, $responseBody);
    }
}
