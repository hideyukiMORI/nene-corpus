<?php

declare(strict_types=1);

namespace NeneCorpus\Http;

use Psr\Http\Message\ServerRequestInterface;

/**
 * Extracts client metadata from HTTP requests for session logging and rate limiting.
 *
 * Client IP uses REMOTE_ADDR only (same policy as chat rate limits). Reverse-proxy
 * operators must configure the web server so REMOTE_ADDR reflects the visitor.
 */
final class RequestMetadataExtractor
{
    private const MAX_CLIENT_IP_LENGTH = 45;

    private const MAX_USER_AGENT_LENGTH = 512;

    private const MAX_REFERER_LENGTH = 2048;

    public static function clientIp(ServerRequestInterface $request): ?string
    {
        $ip = trim((string) ($request->getServerParams()['REMOTE_ADDR'] ?? ''));

        if ($ip === '') {
            return null;
        }

        return substr($ip, 0, self::MAX_CLIENT_IP_LENGTH);
    }

    public static function userAgent(ServerRequestInterface $request): ?string
    {
        $userAgent = trim($request->getHeaderLine('User-Agent'));

        if ($userAgent === '') {
            return null;
        }

        return mb_substr($userAgent, 0, self::MAX_USER_AGENT_LENGTH);
    }

    public static function referer(ServerRequestInterface $request): ?string
    {
        $referer = trim($request->getHeaderLine('Referer'));

        if ($referer === '') {
            return null;
        }

        return mb_substr($referer, 0, self::MAX_REFERER_LENGTH);
    }
}
